const express = require('express');
const router = express.Router();
const { getShopByDomain } = require('../services/database/shops');
const products = require('../services/shopify/products');

router.get('/', async (req, res) => {
  try {
    const shop = await getShopByDomain(req.query.shop_domain);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const list = await products.list(shop.shop_domain, shop.access_token, { limit: req.query.limit || 50 });
    res.json({ products: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
