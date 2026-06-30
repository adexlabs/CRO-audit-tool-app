const { getRestClient } = require("./client");

async function list(shopDomain, accessToken, params = {}) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get("/pages.json", { params });
  return data.pages;
}

async function getOne(shopDomain, accessToken, id) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get(`/pages/${id}.json`);
  return data.page;
}

module.exports = { list, getOne };
