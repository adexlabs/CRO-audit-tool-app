const axios = require("axios");

function adminClient(shopDomain, accessToken) {
  return axios.create({
    baseURL: `https://${shopDomain}/admin/api/2024-10`,
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json"
    }
  });
}

module.exports = adminClient;