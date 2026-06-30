function isValidShopDomain(domain) {
  return typeof domain === 'string' && /^[a-zA-Z0-9-]+\.myshopify\.com$/.test(domain);
}

function isValidUrl(url) {
  try { new URL(url); return true; } catch (e) { return false; }
}

module.exports = { isValidShopDomain, isValidUrl };
