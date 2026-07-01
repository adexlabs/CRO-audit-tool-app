const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {

    if (!req.shop) {
        return res.status(401).json({
            error: "Shop not authenticated"
        });
    }

    res.json({
        shop: req.shop.shop_domain
    });

});

module.exports = router;