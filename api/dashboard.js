const express = require('express');
const router = express.Router();

const { getShopByDomain } = require('../services/database/shops');
const { listAuditsForShop } = require('../services/database/audits');
const { listFixesForShop } = require('../services/database/fixes');

/** GET /api/dashboard?shopDomain=... — summary used by the main app screen */
router.get('/', async (req, res) => {
  const { shopDomain } = req.query;
  if (!shopDomain) return res.status(400).json({ error: 'shopDomain is required' });

  try {
    const shop = await getShopByDomain(shopDomain);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const [audits, fixes] = await Promise.all([
      listAuditsForShop(shop.id, 10),
      listFixesForShop(shop.id, 10)
    ]);

    const latestAudit = audits[0] || null;

    res.json({
      shop: { id: shop.id, domain: shop.shop_domain, plan: shop.plan },
      latestAudit,
      recentAudits: audits,
      recentFixes: fixes,
      totalFixesApplied: fixes.filter((f) => f.applied).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
