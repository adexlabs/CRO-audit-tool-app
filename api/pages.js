const express = require('express');
const router = express.Router();
const pages = require('../services/shopify/pages');

// GET /api/pages?shop=...
router.get('/', async (req, res) => {
  try {
    const list = await pages.list(req.shop.shop_domain, req.shop.access_token);
    res.json({ pages: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
