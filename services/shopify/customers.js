const { getRestClient } = require("./client");

async function list(shopDomain, accessToken, params = {}) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get("/customers.json", { params });
  return data.customers;
}

async function getOne(shopDomain, accessToken, id) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get(`/customers/${id}.json`);
  return data.customer;
}

module.exports = { list, getOne };
