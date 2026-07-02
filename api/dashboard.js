const express = require('express');
const router = express.Router();

const { listAuditsForShop, getAudit } = require('../services/database/audits');
const { listFixesForShop } = require('../services/database/fixes');

/** GET /api/dashboard?shop=... — summary used by the main app screen */
router.get('/', async (req, res) => {
  try {
    const shop = req.shop;

    const [audits, fixes] = await Promise.all([
      listAuditsForShop(shop.id, 10),
      listFixesForShop(shop.id, 10)
    ]);

    const latestAuditSummary = audits[0] || null;
    // listAuditsForShop does a plain select, so it doesn't include the
    // joined audit_issues — fetch the full record so the frontend can
    // render the issues list on first load, not just the score.
    const latestAudit = latestAuditSummary ? await getAudit(latestAuditSummary.id) : null;

    res.json({
      shop: { id: shop.id, domain: shop.shop_domain, plan: shop.plan },
      latestAudit,
      recentAudits: audits,
      recentFixes: fixes,
      totalFixesApplied: fixes.filter((f) => f.applied).length
    });
  } catch (err) {
    console.error('[api/dashboard]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
