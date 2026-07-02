const express = require('express');
const router = express.Router();
const { getAudit } = require('../services/database/audits');
const { listReportsForShop } = require('../services/database/reports');
const { generateHtmlReport } = require('../services/reportGenerator');

// GET /api/reports/:auditId?shop=... -> returns rendered HTML report
router.get('/:auditId', async (req, res) => {
  try {
    const audit = await getAudit(req.params.auditId);
    // Ownership check: don't let one shop view another shop's report.
    if (!audit || audit.shop_id !== req.shop.id) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    const html = generateHtmlReport(audit);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(404).json({ error: 'Audit not found' });
  }
});

// GET /api/reports?shop=... -> list saved report records
router.get('/', async (req, res) => {
  try {
    const reports = await listReportsForShop(req.shop.id);
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
