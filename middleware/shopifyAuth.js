const { getShopByDomain } = require("../services/database/shops");

module.exports = async (req,res,next)=>{

    console.log("PATH =", req.originalUrl);
    console.log("HEADER =", req.headers["x-shopify-shop-domain"]);
    console.log("QUERY =", req.query.shop);

    try{

        const shop =
            req.headers["x-shopify-shop-domain"] ||
            req.query.shop;

        if(!shop){

            return res.status(401).json({
                error:"Missing shop"
            });

        }

        const store = await getShopByDomain(shop);

        if(!store){

            return res.status(404).json({
                error:"Store not installed"
            });

        }

        req.shop = store;

        next();

    }
    catch(err){

        console.error(err);

        res.status(500).json({
            error:err.message
        });

    }

}