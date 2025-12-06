export default async function handler(req, res) {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch URL" });
    }

    const html = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ html });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.toString() });
  }
}
