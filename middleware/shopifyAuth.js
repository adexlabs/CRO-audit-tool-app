const { getShopByDomain } = require("../services/database/shops");

module.exports = async(req,res,next)=>{

    const shop=req.headers["x-shopify-shop-domain"];

    if(!shop)

        return res.status(401).json({

            error:"Shop not found"

        });

    const store=await getShopByDomain(shop);

    if(!store)

        return res.status(404).json({

            error:"Store not installed"

        });

    req.shop=store;

    next();

};