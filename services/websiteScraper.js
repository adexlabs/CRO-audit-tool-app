const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeWebsite(url) {
    try {
        const response = await axios.get(url, {
            timeout: 15000,
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        const $ = cheerio.load(response.data);

        return {
            title: $("title").text(),

            metaDescription:
                $('meta[name="description"]').attr("content") || "",

            h1: $("h1")
                .map((i, el) => $(el).text().trim())
                .get(),

            buttons: $("button,a")
                .map((i, el) => $(el).text().trim())
                .get()
                .slice(0, 50),

            forms: $("form").length,
            images: $("img").length,

            text: $("body")
                .text()
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 25000),

            // raw HTML kept (truncated) so fixService can produce real diffs
            rawHtml: response.data.slice(0, 60000)
        };
    } catch (error) {
        console.error("SCRAPER ERROR:", error.message);
        return {
            title: "",
            metaDescription: "",
            h1: [],
            buttons: [],
            forms: 0,
            images: 0,
            text: "",
            rawHtml: ""
        };
    }
}

module.exports = scrapeWebsite;
