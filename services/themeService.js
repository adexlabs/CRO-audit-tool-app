const axios = require("axios");

function adminClient(shop, accessToken) {
    return axios.create({
        baseURL: `https://${shop}/admin/api/2024-04`,
        headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json"
        }
    });
}

async function getActiveThemeId(shop, accessToken) {
    const client = adminClient(shop, accessToken);
    const { data } = await client.get("/themes.json");
    const active = data.themes.find((t) => t.role === "main");
    if (!active) throw new Error("No active (main) theme found");
    return active.id;
}

// Fetch a theme asset (e.g. "sections/main-product.liquid" or "templates/index.json")
async function getThemeAsset(shop, accessToken, themeId, key) {
    const client = adminClient(shop, accessToken);
    const { data } = await client.get(
        `/themes/${themeId}/assets.json`,
        { params: { "asset[key]": key } }
    );
    return data.asset.value; // string content
}

async function putThemeAsset(shop, accessToken, themeId, key, value) {
    const client = adminClient(shop, accessToken);
    const { data } = await client.put(`/themes/${themeId}/assets.json`, {
        asset: { key, value }
    });
    return data.asset;
}

// List a small set of common, safe-to-edit theme assets (home page section + global)
async function listEditableAssets(shop, accessToken, themeId) {
    const client = adminClient(shop, accessToken);
    const { data } = await client.get(`/themes/${themeId}/assets.json`);
    return data.assets
        .map((a) => a.key)
        .filter(
            (key) =>
                key.startsWith("sections/") ||
                key.startsWith("templates/") ||
                key.startsWith("snippets/")
        );
}

// Store page content (e.g. About, FAQ pages) via Online Store Pages API
async function getPage(shop, accessToken, pageId) {
    const client = adminClient(shop, accessToken);
    const { data } = await client.get(`/pages/${pageId}.json`);
    return data.page;
}

async function updatePage(shop, accessToken, pageId, bodyHtml) {
    const client = adminClient(shop, accessToken);
    const { data } = await client.put(`/pages/${pageId}.json`, {
        page: { id: pageId, body_html: bodyHtml }
    });
    return data.page;
}

module.exports = {
    getActiveThemeId,
    getThemeAsset,
    putThemeAsset,
    listEditableAssets,
    getPage,
    updatePage
};
