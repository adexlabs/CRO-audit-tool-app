const { getRestClient } = require("./client");

async function list(shopDomain, accessToken, params = {}) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get("/orders.json", { params });
  return data.orders;
}

async function getOne(shopDomain, accessToken, id) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get(`/orders/${id}.json`);
  return data.order;
}

module.exports = { list, getOne };
