const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

async function getHiruNews() {
    const { data } = await axios.get("https://hirunews.lk", {
        headers: {
            "User-Agent": "Mozilla/5.0"
        }
    });

    const $ = cheerio.load(data);
    const scripts = $('script[type="application/ld+json"]');

    for (const el of scripts.toArray()) {
        try {
            const json = JSON.parse($(el).html());

            if (
                json["@type"] === "ItemList" &&
                Array.isArray(json.itemListElement)
            ) {
                return json.itemListElement.map(item => ({
                    title: item.item?.headline,
                    description: item.item?.description,
                    image: item.item?.image,
                    url: item.item?.url,
                    published: item.item?.datePublished
                }));
            }
        } catch {}
    }

    return [];
}

// Home
app.get("/", (req, res) => {
    res.json({
        developer: "Your Name",
        endpoints: {
            latest_news: "/api/news"
        }
    });
});

// News Endpoint
app.get("/api/news", async (req, res) => {
    try {
        const news = await getHiruNews();

        res.json({
            status: true,
            count: news.length,
            data: news
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            error: err.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API Running On Port ${PORT}`);
});
