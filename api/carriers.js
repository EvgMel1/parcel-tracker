// api/carriers.js
const API_BASE = "https://api.17track.net/track/v2.4";

export default async function handler(req, res) {
  if (!process.env.SEVENTEEN_API_KEY) {
    return res.status(500).json({ error: "SEVENTEEN_API_KEY is not set" });
  }

  try {
    const r = await fetch(`${API_BASE}/getcarriers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "17token": process.env.SEVENTEEN_API_KEY,
      },
      body: JSON.stringify([]),
    });

    const text = await r.text();
    let json;

    try {
      json = JSON.parse(text);
    } catch {
      console.error("❌ Invalid JSON from 17track:", text);
      throw new Error("Invalid JSON from 17track");
    }

    // если код не 0 — значит ошибка
    if (json.code !== 0 || !Array.isArray(json.data)) {
      console.warn("⚠️ 17track returned unexpected response:", json);
      return res.status(200).json({
        source: "fallback",
        data: [
          { id: 100003, name: "Auto Detect", country: "Global" },
          { id: 5053, name: "Nova Poshta", country: "Ukraine" },
          { id: 5006, name: "DHL", country: "Germany" },
          { id: 5004, name: "FedEx", country: "USA" },
          { id: 5002, name: "UPS", country: "USA" },
          { id: 3011, name: "China Post", country: "China" },
        ],
      });
    }

    // всё хорошо — возвращаем carriers
    const carriers = json.data.map((c) => ({
      id: c.id,
      name: c.name,
      country: c.country_name || "",
    }));

    return res.status(200).json({ source: "api", data: carriers });
  } catch (err) {
    console.error("carriers error:", err);
    return res.status(500).json({ error: "Failed to load carriers" });
  }
}
