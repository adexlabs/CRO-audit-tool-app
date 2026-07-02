require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const shopifyAuth = require("./middleware/shopifyAuth");

const app = express();

app.use(express.json({
    verify: (req,res,buf)=>{
        req.rawBody = buf.toString();
    }
}));

app.use(cors());

app.use(express.static(path.join(__dirname,"frontend/public")));


// Public routes

app.use("/auth", require("./api/auth"));

app.use("/api/session", require("./api/session"));

app.use("/webhooks", require("./api/webhooks"));

app.get("/api/health",(req,res)=>{
    res.json({
        ok:true,
        time:new Date().toISOString()
    });
});


// Protected routes

app.use(shopifyAuth);

app.use("/api/audit", require("./api/audit"));
app.use("/api/fix", require("./api/fix"));
app.use("/api/reports", require("./api/reports"));
app.use("/api/settings", require("./api/settings"));
app.use("/api/themes", require("./api/themes"));
app.use("/api/products", require("./api/products"));
app.use("/api/pages", require("./api/pages"));
app.use("/api/collections", require("./api/collections"));

app.get("*",(req,res)=>{
    res.sendFile(path.join(__dirname,"frontend/public/index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
    console.log(`Running on ${PORT}`);
});

module.exports=app;