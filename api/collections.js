const express = require('express');
const router = express.Router();
const collections = require('../services/shopify/collections');

// GET /api/collections?shop=...
router.get('/', async (req, res) => {
  try {
    const list = await collections.list(req.shop.shop_domain, req.shop.access_token);
    res.json({ collections: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
