require("dotenv").config();

const path = require("path");

const { shopifyApp } = require("@shopify/shopify-app-express");
const { SQLiteSessionStorage } = require("@shopify/shopify-app-session-storage-sqlite");
const { LATEST_API_VERSION } = require("@shopify/shopify-api");

// Validate required environment variables
const requiredEnv = [
    "SHOPIFY_API_KEY",
    "SHOPIFY_API_SECRET",
    "SHOPIFY_SCOPES",
    "HOST"
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

const shopify = shopifyApp({
    api: {
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecretKey: process.env.SHOPIFY_API_SECRET,

        // Comma-separated scopes from .env
        scopes: process.env.SHOPIFY_SCOPES
            .split(",")
            .map(scope => scope.trim()),

        // HOST should be:
        // cro-audit-tool-app.vercel.app
        hostName: process.env.HOST
            .replace(/^https?:\/\//, "")
            .replace(/\/$/, ""),

        apiVersion: LATEST_API_VERSION,

        // Embedded App Distribution
        isEmbeddedApp: true,
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