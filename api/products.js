const express = require('express');
const router = express.Router();
const products = require('../services/shopify/products');

// GET /api/products?shop=...&limit=50
router.get('/', async (req, res) => {
  try {
    const list = await products.list(req.shop.shop_domain, req.shop.access_token, { limit: req.query.limit || 50 });
    res.json({ products: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
