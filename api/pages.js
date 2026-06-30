const express = require('express');
const router = express.Router();
const { getShopByDomain } = require('../services/database/shops');
const pages = require('../services/shopify/pages');

router.get('/', async (req, res) => {
  try {
    const shop = await getShopByDomain(req.query.shopDomain);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const list = await pages.list(shop.shop_domain, shop.access_token);
    res.json({ pages: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
