const { getRestClient } = require('./client');

/**
 * Get a single theme asset's raw content (e.g. "sections/main-product.liquid",
 * "templates/index.json", "assets/theme.css").
 */
async function getAsset(shopDomain, accessToken, themeId, key) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get(`/themes/${themeId}/assets.json`, {
    params: { 'asset[key]': key }
  });
  return data.asset; // { key, value, content_type, ... }
}

/** List every asset key in a theme (so the audit knows what files exist) */
async function listAssets(shopDomain, accessToken, themeId) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get(`/themes/${themeId}/assets.json`);
  return data.assets; // array of {key, content_type, size, ...}
}

/**
 * Overwrite a theme asset with new content. This is what makes an AI fix
 * go live on the storefront immediately — Shopify serves theme assets
 * directly, no rebuild/deploy step required.
 */
async function updateAsset(shopDomain, accessToken, themeId, key, value) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.put(`/themes/${themeId}/assets.json`, {
    asset: { key, value }
  });
  return data.asset;
}

module.exports = { getAsset, listAssets, updateAsset };
