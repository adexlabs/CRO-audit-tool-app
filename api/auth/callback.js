const { verifyHmac, exchangeToken } = require("../../services/shopifyAuth");
const saveShop = require("../../services/supabaseService").saveShop;
const runAuditForShop = require("../../services/auditRunner");

module.exports = async (req, res) => {
  const { shop, code, hmac, state } = req.query;

  if (!verifyHmac(req.query)) {
    return res.status(400).send("HMAC validation failed");
  }

  // TODO: verify `state` matches what you stored in api/auth.js

  const { access_token, scope } = await exchangeToken(shop, code);

  await saveShop({ shop_domain: shop, access_token, scope });

  // Fire-and-forget: don't block the redirect on the audit finishing
  runAuditForShop(shop).catch(err =>
    console.error("Initial audit failed:", err)
  );

  // Redirect into the embedded app
  res.redirect(`https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`);
};