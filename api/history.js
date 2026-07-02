const express = require('express');
const router = express.Router();

const { listHistory } = require('../services/database/history');

// GET /api/history?shop=...
router.get('/', async (req, res) => {
  try {
    const history = await listHistory(req.shop.id);
    res.json({ history });
  } catch (err) {
    console.error('[api/history]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
