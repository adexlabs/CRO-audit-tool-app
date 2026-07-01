const express = require('express');
const router = express.Router();
const supabase = require('../services/database/supabase');
const { getShopByDomain } = require('../services/database/shops');

router.get('/', async (req, res) => {
  try {
    const shop = await getShopByDomain(req.query.shop_domain);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json({ settings: shop.settings || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { shop_domain, settings } = req.body;
  try {
    const shop = await getShopByDomain(shop_domain);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const { data, error } = await supabase
      .from('shops')
      .update({ settings })
      .eq('id', shop.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ settings: data.settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
