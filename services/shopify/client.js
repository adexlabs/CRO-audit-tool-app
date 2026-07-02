const axios = require('axios');
require('dotenv').config();

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';

function getRestClient(shopDomain, accessToken) {
  return axios.create({
    baseURL: `https://${shopDomain}/admin/api/${API_VERSION}`,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    },
    timeout: 20000
  });
}

function getGraphqlClient(shopDomain, accessToken) {
  return axios.create({
    baseURL: `https://${shopDomain}/admin/api/${API_VERSION}/graphql.json`,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    },
    timeout: 20000
  });
}

module.exports = { getRestClient, getGraphqlClient, API_VERSION };
