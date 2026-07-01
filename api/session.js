const express = require("express");
const router = express.Router();

const { getShopByDomain } = require("../services/database/shops");

router.get("/", async (req, res) => {

    try {

        const shop = req.query.shop;

        if (!shop)
            return res.status(400).json({
                error: "Missing shop"
            });

        const store = await getShopByDomain(shop);

        if (!store)
            return res.status(404).json({
                error: "Shop not found"
            });

        res.json({
            shop: store.shop_domain
        });

    }

    catch(err){

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;