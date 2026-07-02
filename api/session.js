const express = require("express");
const router = express.Router();

const { getShopByDomain } = require("../services/database/shops");
const { isValidShopDomain } = require("../services/utils/validators");

// GET /api/session?shop=your-store.myshopify.com
// This route is intentionally public (mounted before shopifyAuth) — it's
// the very first call the frontend makes on load, before we know whether
// a session/shop record even exists yet.
router.get("/", async (req, res) => {
    const shop = String(req.query.shop || "").trim();

    if (!isValidShopDomain(shop)) {
        return res.status(400).json({
            error: "Missing or invalid shop parameter"
        });
    }

    try {
        const store = await getShopByDomain(shop);

        if (!store) {
            return res.status(404).json({
                error: "Store not installed. Please install the app first."
            });
        }

        res.json({
            shop: store.shop_domain
        });
    } catch (err) {
        console.error("[api/session]", err);
        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;
