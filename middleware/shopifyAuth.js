const { getShopByDomain } = require("../services/database/shops");

module.exports = async (req, res, next) => {
    try {
        // Read shop from query OR body OR Shopify header
        const shop =
            req.query.shop ||
            req.body.shopDomain ||
            req.headers["x-shopify-shop-domain"];

        if (!shop) {
            return res.status(401).json({
                error: "Missing shop"
            });
        }

        const store = await getShopByDomain(shop);

        if (!store) {
            return res.status(404).json({
                error: "Store not installed"
            });
        }

        req.shop = store;

        next();

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};