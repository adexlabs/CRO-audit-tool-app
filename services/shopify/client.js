const axios = require('axios');
require('dotenv').config();

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';

/**
 * Returns an axios instance pre-configured for a given shop's Admin REST API.
 * shopDomain e.g. "my-store.myshopify.com"
 */
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

/**
 * Returns an axios instance for the Admin GraphQL API.
 */
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
