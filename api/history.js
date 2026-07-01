const express = require('express');
const router = express.Router();
const { getShopByDomain } = require('../services/database/shops');
const { listHistory } = require('../services/database/history');

router.get('/', async (req, res) => {
  const { shop_domain } = req.query;
  try {
    const shop = await getShopByDomain(shop_domain);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const history = await listHistory(shop.id);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
