const { getGraphqlClient } = require('./client');

async function graphqlRequest(shopDomain, accessToken, query, variables = {}) {
  const client = getGraphqlClient(shopDomain, accessToken);
  const { data } = await client.post('', { query, variables });
  if (data.errors) {
    throw new Error('Shopify GraphQL error: ' + JSON.stringify(data.errors));
  }
  return data.data;
}

module.exports = { graphqlRequest };
