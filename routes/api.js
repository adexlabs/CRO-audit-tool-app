const express = require("express");
const shopify = require("../services/shopify");
const scrapeWebsite = require("../services/websiteScraper");
const generateAudit = require("../services/claudeService");
const generateFix = require("../services/fixService");
const theme = require("../services/themeService");
const db = require("../services/supabaseService");

const router = express.Router();

// All routes below require a valid embedded-app session
router.use(shopify.validateAuthenticatedSession());

// GET current (latest) audit for the logged-in shop
router.get("/audit", async (req, res) => {
    try {
        const shop = res.locals.shopify.session.shop;
        const audit = await db.getLatestAuditForShop(shop);

        if (!audit) {
            return res.status(404).json({ success: false, error: "No audit yet" });
        }

        return res.status(200).json({ success: true, audit });
    } catch (error) {
        console.error("GET /audit error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// POST re-run a fresh audit on demand
router.post("/audit/run", async (req, res) => {
    try {
        const shop = res.locals.shopify.session.shop;
        const storefrontUrl = `https://${shop}`;

        const websiteData = await scrapeWebsite(storefrontUrl);
        const report = await generateAudit(websiteData, storefrontUrl);
        const saved = await db.saveAudit(shop, report, websiteData);

        return res.status(200).json({ success: true, audit: saved });
    } catch (error) {
        console.error("POST /audit/run error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// POST propose a fix for one recommendation -> returns a diff for review
// body: { auditId, recommendationId }
router.post("/fix/propose", async (req, res) => {
    try {
        const shop = res.locals.shopify.session.shop;
        const accessToken = res.locals.shopify.session.accessToken;
        const { auditId, recommendationId } = req.body || {};

        if (!auditId || !recommendationId) {
            return res.status(400).json({ success: false, error: "auditId and recommendationId are required" });
        }

        const audit = await db.getAuditById(auditId).catch(() => null);
        const recs = audit?.recommendations || [];
        const recommendation = recs.find((r) => r.id === recommendationId);

        if (!recommendation) {
            return res.status(404).json({ success: false, error: "Recommendation not found" });
        }

        if (recommendation.fixable_by_ai === false) {
            return res.status(400).json({
                success: false,
                error: "This recommendation requires a manual business decision and can't be auto-fixed."
            });
        }

        // Default target: the active theme's homepage section template.
        // For real deployments you'd map recommendation.category -> the right
        // theme asset/page; this picks the storefront homepage as a sane default.
        const themeId = await theme.getActiveThemeId(shop, accessToken);
        const assetKey = "templates/index.json";
        let sourceContent;

        try {
            sourceContent = await theme.getThemeAsset(shop, accessToken, themeId, assetKey);
        } catch (e) {
            return res.status(502).json({
                success: false,
                error: "Could not read theme asset to generate a fix: " + e.message
            });
        }

        const fix = await generateFix({
            recommendation,
            sourceType: "theme_asset",
            sourceContent,
            sourceLabel: assetKey
        });

        const fixRecord = await db.saveFixRecord({
            shop_domain: shop,
            audit_id: auditId,
            recommendation_id: recommendationId,
            source_type: "theme_asset",
            source_key: assetKey,
            find_snippet: fix.find,
            replace_snippet: fix.replace,
            explanation: fix.explanation,
            status: "pending"
        });

        return res.status(200).json({
            success: true,
            fix: { ...fix, id: fixRecord.id, themeId, assetKey }
        });
    } catch (error) {
        console.error("POST /fix/propose error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// POST apply a previously proposed fix after merchant approval
// body: { fixId, themeId, assetKey, find, replace }
router.post("/fix/apply", async (req, res) => {
    try {
        const shop = res.locals.shopify.session.shop;
        const accessToken = res.locals.shopify.session.accessToken;
        const { fixId, themeId, assetKey, find, replace } = req.body || {};

        if (!themeId || !assetKey || !find || replace === undefined) {
            return res.status(400).json({ success: false, error: "Missing fix details" });
        }

        const currentContent = await theme.getThemeAsset(shop, accessToken, themeId, assetKey);

        if (!currentContent.includes(find)) {
            return res.status(409).json({
                success: false,
                error: "The original snippet no longer matches the live theme (it may have changed). Re-run the audit and try again."
            });
        }

        const updatedContent = currentContent.replace(find, replace);

        await theme.putThemeAsset(shop, accessToken, themeId, assetKey, updatedContent);

        return res.status(200).json({ success: true, applied: true, fixId });
    } catch (error) {
        console.error("POST /fix/apply error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
