const { getRestClient } = require('./client');

async function listMetafields(shopDomain, accessToken, ownerResource, ownerId) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get(`/${ownerResource}/${ownerId}/metafields.json`);
  return data.metafields;
}

module.exports = { listMetafields };
