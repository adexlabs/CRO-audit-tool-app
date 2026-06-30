const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');

const { isValidShopDomain } = require('../services/utils/validators');
const { getOrCreateShop } = require('../services/database/shops');
const { logEvent } = require('../services/database/history');

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_APP_URL,
  SHOPIFY_SCOPES,
  SHOPIFY_API_VERSION
} = process.env;

const API_VERSION = SHOPIFY_API_VERSION || '2024-10';

// In-memory nonce store. Fine for a single-instance dev deploy; swap for
// Supabase/Redis if you run multiple serverless instances in production,
// since Vercel functions don't share memory between invocations.
const pendingStates = new Map();

/**
 * GET /auth/install?shop=your-store.myshopify.com
 * Entry point — Shopify (or you, manually) redirects here to start install.
 * Redirects the merchant to Shopify's OAuth consent screen.
 */
router.get('/install', (req, res) => {
  const shop = String(req.query.shop || '').trim();

  if (!isValidShopDomain(shop)) {
    return res.status(400).send('Invalid or missing "shop" parameter. Expected format: your-store.myshopify.com');
  }
  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
    return res.status(500).send('SHOPIFY_API_KEY / SHOPIFY_API_SECRET are not configured on the server.');
  }

  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, { shop, createdAt: Date.now() });

  const redirectUri = `${SHOPIFY_APP_URL}/auth/callback`;
  const scopes = SHOPIFY_SCOPES || 'read_products,write_products,read_themes,write_themes,read_content,write_content';

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${encodeURIComponent(SHOPIFY_API_KEY)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  res.redirect(installUrl);
});

/**
 * GET /auth/callback
 * Shopify redirects here after the merchant approves the install.
 * Verifies the request, exchanges the temporary code for a permanent
 * Admin API access token, and stores the shop + token in Supabase.
 */
router.get('/callback', async (req, res) => {
  const { shop, code, state, hmac } = req.query;

  if (!isValidShopDomain(shop)) {
    return res.status(400).send('Invalid shop parameter.');
  }

  // 1. Verify state to prevent CSRF
  const saved = pendingStates.get(state);
  pendingStates.delete(state);
  if (!saved || saved.shop !== shop) {
    return res.status(403).send('Invalid OAuth state. Please restart the install from /auth/install?shop=your-store.myshopify.com');
  }

  // 2. Verify the HMAC Shopify signed the query string with
  if (!verifyOAuthHmac(req.query)) {
    return res.status(401).send('HMAC validation failed — request may not be from Shopify.');
  }

  try {
    // 3. Exchange the temporary code for a permanent access token
    const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code
    });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error('Shopify did not return an access token.');

    // 4. Persist the shop + token
    const shopRecord = await getOrCreateShop(shop, accessToken);
    await logEvent({ shopId: shopRecord.id, eventType: 'app_installed', metadata: { shop } });

    // 5. (Optional but recommended) register the mandatory webhooks now
    await registerMandatoryWebhooks(shop, accessToken);

    // 6. Send the merchant into the app UI
    res.redirect(`/?shop=${encodeURIComponent(shop)}&installed=1`);
  } catch (err) {
    console.error('[auth/callback] error:', err.response?.data || err.message);
    res.status(500).send('Failed to complete installation. Check server logs.');
  }
});

/** Verifies Shopify's HMAC on the OAuth callback query string */
function verifyOAuthHmac(query) {
  if (!SHOPIFY_API_SECRET) return false;
  const { hmac, signature, ...rest } = query;
  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${Array.isArray(rest[key]) ? rest[key].join(',') : rest[key]}`)
    .join('&');

  const generated = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(hmac));
  } catch (e) {
    return false; // length mismatch etc.
  }
}

/** Registers the webhooks api/webhooks.js already handles */
async function registerMandatoryWebhooks(shop, accessToken) {
  const topics = [
    { topic: 'app/uninstalled', address: `${SHOPIFY_APP_URL}/webhooks/app/uninstalled` },
    { topic: 'customers/data_request', address: `${SHOPIFY_APP_URL}/webhooks/customers/data_request` },
    { topic: 'customers/redact', address: `${SHOPIFY_APP_URL}/webhooks/customers/redact` },
    { topic: 'shop/redact', address: `${SHOPIFY_APP_URL}/webhooks/shop/redact` }
  ];

  for (const { topic, address } of topics) {
    try {
      await axios.post(
        `https://${shop}/admin/api/${API_VERSION}/webhooks.json`,
        { webhook: { topic, address, format: 'json' } },
        { headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      // Don't fail the whole install if one webhook registration fails
      console.warn(`[auth/callback] Failed to register webhook ${topic}:`, err.response?.data || err.message);
    }
  }
}

module.exports = router;
