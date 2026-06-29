require("dotenv").config();

const { shopifyApp } = require("@shopify/shopify-app-express");
const { SQLiteSessionStorage } = require("@shopify/shopify-app-session-storage-sqlite");
const { LATEST_API_VERSION } = require("@shopify/shopify-api");
const path = require("path");

// Define scopes
const scopes = process.env.SHOPIFY_SCOPES
  ? process.env.SHOPIFY_SCOPES.split(",")
  : [];

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: scopes,
    hostName: process.env.HOST.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    apiVersion: LATEST_API_VERSION,
    restResources: undefined,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: new SQLiteSessionStorage(
    path.join(__dirname, "..", "db", "sessions.sqlite")
  ),
});

module.exports = shopify;