const crypto = require("crypto");

module.exports = (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).send("Missing shop param");

  const state = crypto.randomBytes(16).toString("hex");
  // TODO: store `state` (e.g. in a short-lived cookie or Redis) to verify in callback

  const redirectUri = `${process.env.APP_URL}/api/auth/callback`;
  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${process.env.SHOPIFY_API_KEY}` +
    `&scope=${process.env.SHOPIFY_SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  res.redirect(installUrl);
};