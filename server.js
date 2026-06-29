require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const shopify = require("./services/shopify");

const authRoutes = require("./routes/auth");
const webhookRoutes = require("./routes/webhooks");
const apiRoutes = require("./routes/api");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------
// Shopify Authentication
// -------------------------------
app.use("/", authRoutes);

// -------------------------------
// Shopify Webhooks
// -------------------------------
app.use("/api/webhooks", webhookRoutes);

// -------------------------------
// Protected API Routes
// -------------------------------
app.use("/api", apiRoutes);

// -------------------------------
// Static Files
// -------------------------------
app.use(express.static(path.join(__dirname, "public")));

// -------------------------------
// Embedded App
// -------------------------------
app.get("/*", shopify.ensureInstalledOnShop(), (req, res) => {
    const html = fs
        .readFileSync(path.join(__dirname, "public", "index.html"), "utf8")
        .replace("%SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
});

// -------------------------------
// Global Error Handler
// -------------------------------
app.use((err, req, res, next) => {
    console.error("SERVER ERROR:");
    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal Server Error",
    });
});

// -------------------------------
// Start Server
// -------------------------------
const PORT = process.env.PORT || 3000;

if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`✅ CRO Audit App running on http://localhost:${PORT}`);
    });
}