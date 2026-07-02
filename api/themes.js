const express = require('express');
const router = express.Router();
const { getActiveTheme, listThemes } = require('../services/shopify/themes');
const { listAssets } = require('../services/shopify/assets');

// GET /api/themes?shop=...
router.get('/', async (req, res) => {
  try {
    const themes = await listThemes(req.shop.shop_domain, req.shop.access_token);
    res.json({ themes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/themes/active/assets?shop=...
router.get('/active/assets', async (req, res) => {
  try {
    const theme = await getActiveTheme(req.shop.shop_domain, req.shop.access_token);
    const assets = await listAssets(req.shop.shop_domain, req.shop.access_token, theme.id);
    res.json({ theme, assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
