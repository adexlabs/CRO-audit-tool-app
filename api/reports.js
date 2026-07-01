const express = require('express');
const router = express.Router();
const { getShopByDomain } = require('../services/database/shops');
const { getAudit } = require('../services/database/audits');
const { saveReport, listReportsForShop } = require('../services/database/reports');
const { generateHtmlReport } = require('../services/reportGenerator');

// GET /api/reports/:auditId -> returns rendered HTML report
router.get('/:auditId', async (req, res) => {
  try {
    const audit = await getAudit(req.params.auditId);
    const html = generateHtmlReport(audit);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(404).json({ error: 'Audit not found' });
  }
});

// GET /api/reports?shop_domain=... -> list saved report records
router.get('/', async (req, res) => {
  try {
    const shop = await getShopByDomain(req.query.shop_domain);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const reports = await listReportsForShop(shop.id);
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
