const express = require("express");
const shopify = require("../services/shopify");
const { deleteShopData } = require("../services/supabaseService");

const router = express.Router();

const webhookHandlers = {
    APP_UNINSTALLED: {
        deliveryMethod: "http",
        callbackUrl: "/api/webhooks/app-uninstalled",
        callback: async (topic, shop) => {
            console.log(`App uninstalled from ${shop}, cleaning up data`);
            await deleteShopData(shop);
        }
    }
};

router.post("/app-uninstalled", shopify.processWebhooks({ webhookHandlers }));

module.exports = router;
