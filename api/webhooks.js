const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabase = require('../services/database/supabase');

/** Verifies the Shopify HMAC signature on incoming webhooks */
function verifyHmac(req) {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  const generated = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET || '')
    .update(req.rawBody || '')
    .digest('base64');
  return hmacHeader === generated;
}

// app/uninstalled -> mark shop uninstalled
router.post('/app/uninstalled', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !verifyHmac(req)) {
    return res.status(401).send('Invalid HMAC');
  }
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  try {
    await supabase.from('shops').update({ uninstalled_at: new Date().toISOString() }).eq('shop_domain', shopDomain);
  } catch (e) { /* swallow */ }
  res.sendStatus(200);
});

// GDPR mandatory webhooks (required by Shopify app review)
router.post('/customers/data_request', (req, res) => res.sendStatus(200));
router.post('/customers/redact', (req, res) => res.sendStatus(200));
router.post('/shop/redact', (req, res) => res.sendStatus(200));

module.exports = router;
