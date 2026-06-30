const { getRestClient } = require("./client");

async function list(shopDomain, accessToken, params = {}) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get("/products.json", { params });
  return data.products;
}

async function getOne(shopDomain, accessToken, id) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get(`/products/${id}.json`);
  return data.product;
}

module.exports = { list, getOne };
