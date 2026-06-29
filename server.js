require("dotenv").config();

const express = require("express");
const path = require("path");
const shopify = require("./services/shopify");

const authRoutes = require("./routes/auth");
const webhookRoutes = require("./routes/webhooks");
const apiRoutes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- Shopify OAuth ---
app.use("/", authRoutes);

// --- Webhooks (raw body handled internally by shopify lib) ---
app.use("/api/webhooks", webhookRoutes);

// --- Authenticated API routes (audit + fix) ---
app.use("/api", apiRoutes);

// --- Embedded app static UI ---
app.use(express.static(path.join(__dirname, "public")));

app.use("/*", shopify.ensureInstalledOnShop(), (req, res) => {
    const fs = require("fs");
    const html = fs
        .readFileSync(path.join(__dirname, "public", "index.html"))
        .toString()
        .replace("%SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY);

    res.set("Content-Type", "text/html");
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`CRO Audit app running on port ${PORT}`);
});
