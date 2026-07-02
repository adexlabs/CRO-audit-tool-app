const express = require('express');
const router = express.Router();
const supabase = require('../services/database/supabase');

// GET /api/settings?shop=...
router.get('/', async (req, res) => {
  try {
    res.json({ settings: req.shop.settings || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings?shop=...   body: { settings }
router.post('/', async (req, res) => {
  const { settings } = req.body;
  try {
    const { data, error } = await supabase
      .from('shops')
      .update({ settings })
      .eq('id', req.shop.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ settings: data.settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
