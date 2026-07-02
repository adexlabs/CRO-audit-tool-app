const axios = require('axios');

async function fetchPageHtml(url) {
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'CRO-Audit-Bot/1.0 (+https://example.com)' },
    timeout: 20000
  });
  return data;
}

module.exports = { fetchPageHtml };
