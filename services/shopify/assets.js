const { getRestClient } = require('./client');

async function getAsset(shopDomain, accessToken, themeId, key) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get(`/themes/${themeId}/assets.json`, {
    params: { 'asset[key]': key }
  });
  return data.asset;
}

async function listAssets(shopDomain, accessToken, themeId) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get(`/themes/${themeId}/assets.json`);
  return data.assets;
}

async function updateAsset(shopDomain, accessToken, themeId, key, value) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.put(`/themes/${themeId}/assets.json`, {
    asset: { key, value }
  });
  return data.asset;
}

module.exports = { getAsset, listAssets, updateAsset };
