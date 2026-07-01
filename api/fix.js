const express = require('express');
const router = express.Router();

const supabase = require('../services/database/supabase');
const { getShopByDomain } = require('../services/database/shops');
const { applyAiFix } = require('../services/shopify/aiFix');
const { restoreFromBackup } = require('../services/shopify/restore');

/**
 * POST /api/fix
 * body: { shopDomain, issueId, auditId }
 *
 * This is what the "Fix with AI" button calls. It loads the issue, asks
 * Claude to generate a corrected theme file, validates it, pushes it live
 * to the Shopify theme, and stores the before/after in Supabase.
 */
router.post('/', async (req, res) => {
  const shopDomain = req.shop.shop_domain;

  const accessToken = req.shop.access_token;

  const { issueId, auditId } = req.body;
  if (!shopDomain || !issueId) {
    return res.status(400).json({ error: 'shopDomain and issueId are required' });
  }

  try {
    const shop = await getShopByDomain(shopDomain);
    if (!shop) return res.status(404).json({ error: 'Shop not found. Install the app first.' });

    const { data: issue, error } = await supabase
      .from('audit_issues')
      .select('*')
      .eq('id', issueId)
      .single();
    if (error || !issue) return res.status(404).json({ error: 'Issue not found' });

    const result = await applyAiFix({
      shopDomain: shop.shop_domain,
      accessToken: shop.access_token,
      shopId: shop.id,
      auditId: auditId || issue.audit_id,
      issue
    });

    res.json({
      success: true,
      fix: result.fix,
      message: 'Fix applied and is now live on your storefront.'
    });
  } catch (err) {
    console.error('[api/fix] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fix/rollback
 * body: { shopDomain, backupId, themeId }
 */
router.post('/rollback', async (req, res) => {
  const shopDomain = req.shop.shop_domain;

  const accessToken = req.shop.access_token;
  const { backupId, themeId } = req.body;
  try {
    const shop = await getShopByDomain(shopDomain);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const restored = await restoreFromBackup({
      shopDomain: shop.shop_domain,
      accessToken: shop.access_token,
      themeId,
      backupId,
      shopId: shop.id
    });

    res.json({ success: true, restored });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
