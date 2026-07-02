function findLiquidImageTags(source) {
  const matches = [...source.matchAll(/<img[^>]*>/gi)];
  return matches.map((m) => m[0]);
}

function extractSchemaBlock(source) {
  const match = source.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    return null;
  }
}

module.exports = { findLiquidImageTags, extractSchemaBlock };
