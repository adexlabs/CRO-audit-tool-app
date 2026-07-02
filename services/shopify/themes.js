const { getRestClient } = require('./client');

async function getActiveTheme(shopDomain, accessToken) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get('/themes.json');
  const theme = (data.themes || []).find((t) => t.role === 'main');
  if (!theme) throw new Error('No published (main) theme found for this store');
  return theme;
}

async function listThemes(shopDomain, accessToken) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get('/themes.json');
  return data.themes;
}

module.exports = { getActiveTheme, listThemes };
