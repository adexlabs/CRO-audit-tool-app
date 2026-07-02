const express = require('express');
const router = express.Router();

const { runAudit, runWebsiteAudit } = require('../services/audit/auditEngine');
const { getOrCreateShop } = require('../services/database/shops');
const { createAudit, completeAudit, failAudit, insertIssues, getAudit } = require('../services/database/audits');
const { logEvent } = require('../services/database/history');

/**
 * POST /api/audit?shop=...
 * body: { url, pageType }
 * Runs a full CRO audit against a live page and persists it to Supabase.
 */
router.post('/', async (req, res) => {
  const { url, pageType } = req.body;

  const shopDomain = req.shop.shop_domain;
  const accessToken = req.shop.access_token;

  if (!shopDomain || !url) {
    return res.status(400).json({ error: 'shopDomain and url are required' });
  }

  let auditRecord;
  try {
    const shop = await getOrCreateShop(shopDomain, accessToken);
    auditRecord = await createAudit({ shopId: shop.id, targetType: pageType || 'homepage', targetUrl: url });

    const result = await runWebsiteAudit({
      url
    });

    let result;

    if (pageType === "website") {

      result = await runWebsiteAudit({

        homepage: url,

        productPages: [],

        collectionPages: [],

        cartPage: `${url.replace(/\/$/, "")}/cart`

      });

    } else {

      result = await runAudit({

        url,

        pageType: pageType || "homepage"

      });

    }

    const savedIssues = await insertIssues(

      auditRecord.id,

      result.issues.map(issue => ({

        category: issue.category,

        severity: issue.severity,

        priority: issue.priority,

        title: issue.title,

        summary: issue.summary,

        description: issue.description,

        why_it_matters: issue.why_it_matters,

        business_impact: issue.business_impact,

        recommendation: issue.recommendation,

        expected_improvement: issue.expected_improvement,

        estimated_conversion_uplift:
          issue.estimated_conversion_uplift,

        estimated_revenue_impact:
          issue.estimated_revenue_impact,

        difficulty:
          issue.difficulty,

        estimated_fix_time:
          issue.estimated_fix_time,

        confidence:
          issue.confidence,

        element_selector:
          issue.element_selector || null,

        file_target:
          issue.file_target,

        current_snippet:
          issue.current_snippet,

        suggested_fix_summary:
          issue.suggested_fix_summary

      }))

    );

    const completed = await completeAudit(

      auditRecord.id,

      {

        overallScore:
          result.overallScore,

        categoryScores:
          result.categoryScores,

        rawFindings:
          result.rawFindings,

        websiteSummary:
          result.websiteSummary ||

          {

            pagesAudited: 1,

            totalIssues:
              result.issues.length

          },

        businessMetrics:
          result.businessMetrics

      }

    );

    await logEvent({ shopId: shop.id, eventType: 'audit_completed', referenceId: auditRecord.id, metadata: { url, pageType } });

    res.json({ audit: completed, issues: savedIssues });
  } catch (err) {
    console.error('[api/audit] error:', err.message);
    if (auditRecord) await failAudit(auditRecord.id, err.message);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/audit/:id?shop=... */
router.get('/:id', async (req, res) => {
  try {
    const audit = await getAudit(req.params.id);
    if (!audit || audit.shop_id !== req.shop.id) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.json({ audit });
  } catch (err) {
    res.status(404).json({ error: 'Audit not found' });
  }
});

module.exports = router;
