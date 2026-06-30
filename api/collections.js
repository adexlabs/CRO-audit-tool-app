const express = require('express');
const router = express.Router();
const { getShopByDomain } = require('../services/database/shops');
const collections = require('../services/shopify/collections');

router.get('/', async (req, res) => {
  try {
    const shop = await getShopByDomain(req.query.shopDomain);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const list = await collections.list(shop.shop_domain, shop.access_token);
    res.json({ collections: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
