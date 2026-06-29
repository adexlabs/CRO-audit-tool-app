const express = require("express");
const shopify = require("../services/shopify");
const scrapeWebsite = require("../services/websiteScraper");
const generateAudit = require("../services/claudeService");
const { saveAudit } = require("../services/supabaseService");

const router = express.Router();

router.get(shopify.config.auth.path, shopify.auth.begin());

router.get(
    shopify.config.auth.callbackPath,
    shopify.auth.callback(),
    async (req, res, next) => {
        try {
            const session = res.locals.shopify.session;
            const shop = session.shop; // e.g. my-store.myshopify.com

            // Fire-and-forget: run the first audit right after install so
            // the merchant lands on a populated dashboard, not an empty state.
            runInitialAudit(shop).catch((err) =>
                console.error("Initial audit failed for", shop, err.message)
            );

            next();
        } catch (err) {
            next(err);
        }
    },
    shopify.redirectToShopifyOrAppRoot()
);

async function runInitialAudit(shop) {
    const storefrontUrl = `https://${shop}`;
    const websiteData = await scrapeWebsite(storefrontUrl);
    const report = await generateAudit(websiteData, storefrontUrl);
    await saveAudit(shop, report, websiteData);
    console.log(`Initial CRO audit completed for ${shop}`);
}

module.exports = router;
