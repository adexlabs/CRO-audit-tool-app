/**
 * Very small Liquid utility — used when we already have a theme file's raw
 * source (from services/shopify/assets.js) and need to locate things like
 * the <img> tags or schema block without a full Liquid AST parser.
 */
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
