const adminClient = require("./shopifyAdminClient");

async function getActiveThemeId(client) {
  const { data } = await client.get("/themes.json");
  const active = data.themes.find(t => t.role === "main");
  return active.id;
}

async function scrapeStore(shopDomain, accessToken) {
  const client = adminClient(shopDomain, accessToken);

  const themeId = await getActiveThemeId(client);

  const { data: assetList } = await client.get(
    `/themes/${themeId}/assets.json`
  );

  // Pull key templates only — don't fetch everything, it's slow and wasteful
  const interesting = assetList.assets.filter(a =>
    /templates\/index|sections\/(hero|header|footer|product|cart)/.test(a.key)
  );

  const assets = {};
  for (const asset of interesting) {
    const { data } = await client.get(
      `/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(asset.key)}`
    );
    assets[asset.key] = data.asset.value;
  }

  const { data: pages } = await client.get("/pages.json?limit=20");
  const { data: shopInfo } = await client.get("/shop.json");

  return {
    shopDomain,
    themeId,
    shopName: shopInfo.shop.name,
    primaryDomain: shopInfo.shop.domain,
    assets,        // { 'sections/hero.liquid': '<liquid source>', ... }
    pages: pages.pages.map(p => ({ id: p.id, title: p.title, handle: p.handle }))
  };
}

module.exports = scrapeStore;