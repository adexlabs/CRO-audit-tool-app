const express = require('express');
const router = express.Router();

const { runAudit } = require('../services/audit/auditEngine');
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

    const result = await runAudit({ url, pageType: pageType || 'homepage' });

    const savedIssues = await insertIssues(auditRecord.id, result.issues.map((i) => ({
      category: i.category,
      severity: i.severity,
      title: i.title,
      description: i.description,
      element_selector: i.element_selector || null,
      file_target: i.file_target,
      current_snippet: i.current_snippet,
      suggested_fix_summary: i.suggested_fix_summary
    })));

    const completed = await completeAudit(auditRecord.id, {
      overallScore: result.overallScore,
      categoryScores: result.categoryScores,
      rawFindings: result.rawFindings
    });

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
