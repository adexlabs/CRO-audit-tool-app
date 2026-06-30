const express = require('express');
const router = express.Router();
const { getShopByDomain } = require('../services/database/shops');
const { getActiveTheme, listThemes } = require('../services/shopify/themes');
const { listAssets } = require('../services/shopify/assets');

router.get('/', async (req, res) => {
  try {
    const shop = await getShopByDomain(req.query.shopDomain);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const themes = await listThemes(shop.shop_domain, shop.access_token);
    res.json({ themes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/active/assets', async (req, res) => {
  try {
    const shop = await getShopByDomain(req.query.shopDomain);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const theme = await getActiveTheme(shop.shop_domain, shop.access_token);
    const assets = await listAssets(shop.shop_domain, shop.access_token, theme.id);
    res.json({ theme, assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
