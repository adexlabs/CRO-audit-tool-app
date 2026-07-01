const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {

    try {

        if (!req.shop) {
            return res.status(401).json({
                error: "Shop not authenticated"
            });
        }

        res.json({
            shop: req.shop.shop_domain
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;