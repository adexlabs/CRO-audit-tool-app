require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const shopifyAuth=require("./middleware/shopifyAuth");

const app = express();

// Capture raw body for Shopify webhook HMAC verification
app.use(
  express.json({
    verify: (req, res, buf) => { req.rawBody = buf.toString(); }
  })
);
app.use(cors());
app.use(express.static(path.join(__dirname, 'frontend/public')));

// ---- Auth (Shopify OAuth install/callback) ----
app.use('/auth', require('./api/auth'));

// ---- API routes ----
app.use('/api/audit', require('./api/audit'));
app.use('/api/fix', require('./api/fix'));
app.use("/api/session", require("./api/session"));
app.use("/api/session", require("./api/session"));
app.use('/api/reports', require('./api/reports'));
app.use('/api/settings', require('./api/settings'));
app.use("/api/session", require("./api/session"));
app.use('/api/themes', require('./api/themes'));
app.use('/api/products', require('./api/products'));
app.use('/api/pages', require('./api/pages'));
app.use('/api/collections', require('./api/collections'));
app.use('/webhooks', require('./api/webhooks'));
app.use("/api",shopifyAuth);

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Fallback to the dashboard SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CRO Audit app running on port ${PORT}`));

module.exports = app;
