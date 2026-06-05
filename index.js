const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();

// Enable CORS
app.use(cors());

async function getHiruNews() {
    const { data } = await axios.get("https://hirunews.lk", {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36"
        },
        timeout: 15000
    });

    const $ = cheerio.load(data);

    const scripts = $('script[type="application/ld+json"]');

    let news = [];

    for (const el of scripts.toArray()) {
        try {
            const json = JSON.parse($(el).html());

            if (
                json &&
                json["@type"] === "ItemList" &&
                Array.isArray(json.itemListElement)
            ) {
                news = json.itemListElement.map(item => ({
                    title: item.item?.headline || "",
                    description: item.item?.description || "",
                    image: item.item?.image || "",
                    url: item.item?.url || "",
                    published: item.item?.datePublished || ""
                }));

                break;
            }
        } catch (err) {
            // Skip invalid JSON-LD blocks
        }
    }

    return news;
}

// Home Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Hiru News API is running Developed By DEV.DINUWA | Contact : 94725122871",
        endpoints: {
            news: "/api/news"
        }
    });
});

// News API
app.get("/api/news", async (req, res) => {
    try {
        const news = await getHiruNews();

        if (!news.length) {
            return res.status(404).json({
                success: false,
                message: "No news found"
            });
        }

        res.json({
            success: true,
            count: news.length,
            data: news
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Railway Port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
