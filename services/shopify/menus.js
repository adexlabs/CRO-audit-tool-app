const { graphqlRequest } = require('./graphql');

async function listMenus(shopDomain, accessToken) {
  const query = `
    query {
      menus(first: 20) {
        edges {
          node { id title handle items { id title url } }
        }
      }
    }
  `;
  const data = await graphqlRequest(shopDomain, accessToken, query);
  return data.menus.edges.map((e) => e.node);
}

module.exports = { listMenus };
