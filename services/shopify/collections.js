const { getRestClient } = require("./client");

async function list(shopDomain, accessToken, params = {}) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get("/custom_collections.json", { params });
  return data.custom_collections;
}

async function getOne(shopDomain, accessToken, id) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get(`/custom_collections/${id}.json`);
  return data.custom_collection;
}

module.exports = { list, getOne };
