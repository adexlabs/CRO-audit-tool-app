const { getRestClient } = require("./client");

async function list(shopDomain, accessToken, params = {}) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get("/blogs.json", { params });
  return data.blogs;
}

async function getOne(shopDomain, accessToken, id) {
  const client = getRestClient(shopDomain, accessToken);
  const { data } = await client.get(`/blogs/${id}.json`);
  return data.blog;
}

module.exports = { list, getOne };
