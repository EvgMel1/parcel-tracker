import express from "express";
import path from "path";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // 👈 только один раз!
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));
app.use(cors({
  origin: [
    "http://localhost:3001",
    "https://sb18uydrxic-45cz--3001--cf284e50.local-corp.webcontainer.io"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
 // 👈 CORS включен


// --- helpers ---
const guessCarrier = (num, explicit) => {
  if (explicit) return Number(explicit);               // из query ?carrier=3011
  // Китайские RR..CN / ..CN
  if (/^[A-Z]{2}\d{9}CN$/i.test(num)) return 3011;     // China Post
  return 100003;                                       // 17TRACK Auto
};

const mapStatus = (raw) => {
  // raw примеры: "InTransit" | "Delivered" | "NotFound" | "Expired" | ...
  const tbl = {
    InTransit: "In Transit",
    Pickup: "Pickup",
    InfoReceived: "Info Received",
    OutForDelivery: "Out for Delivery",
    Delivered: "Delivered",
    Exception: "Exception",
    NotFound: "Not Found",
    Expired: "Expired",
    Undelivered: "Undelivered",
    ReturnToSender: "Return to Sender",
    AvailableForPickup: "Available for Pickup",
  };
  return tbl[raw] || raw || "Unknown";
};



const extractEvents = (trackInfo) => {
  // Берем события из всех провайдеров (обычно 1), newest -> oldest
  const providers = trackInfo?.tracking?.providers || [];
  const events = [];
  providers.forEach(p => {
    (p.events || []).forEach(e => {
      events.push({
        time: e.time || e.message_time || null,
        description: e.description || e.message || "",
        location: e.location || "",
        raw_status: e.status || "",
      });
    });
  });

  // сортируем по времени по убыванию
  events.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  return events;
};

// --- API: track ---
app.get("/api/track", async (req, res) => {
  try {
    const number = String(req.query.number || "").trim();
    const carrierQ = req.query.carrier ? String(req.query.carrier) : undefined;

    if (!number) {
      return res.status(400).json({ error: "Tracking number required" });
    }

    const tryOnce = async (carrierCode) => {
      const r = await fetch("https://api.17track.net/track/v2.4/gettrackinfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "17token": process.env.SEVENTEEN_API_KEY || "",
        },
        body: JSON.stringify([
          {
            number,
            carrier: carrierCode, // важное поле!
          },
        ]),
      });
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(`17TRACK HTTP ${r.status}: ${text}`);
      }
      return r.json();
    };

    // 1) авто/угаданый carrier
    const primaryCarrier = guessCarrier(number, carrierQ);
    let json = await tryOnce(primaryCarrier);

    // Ответ v2.4: { code, data: { accepted: [ { number, track_info, ... } ], rejected: [] } }
    const accepted = json?.data?.accepted || [];
    let item = accepted[0];

    // если NotFound и наш guess был авто (100003) — попробуем China Post (3011) для CN-треков
    const latestStatus = item?.track_info?.latest_status?.status;
    if ((!item || latestStatus === "NotFound") && primaryCarrier === 100003 && /^[A-Z]{2}\d{9}CN$/i.test(number)) {
      json = await tryOnce(3011);
      item = json?.data?.accepted?.[0];
    }

    if (!item) {
      // Попробуем зарегистрировать (иногда нужно)
      await fetch("https://api.17track.net/track/v2.4/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "17token": process.env.SEVENTEEN_API_KEY || "",
        },
        body: JSON.stringify([{ number, carrier: primaryCarrier }]),
      }).catch(() => {});
      return res.status(404).json({ error: "Tracking info not found (queued)" });
    }

    const ti = item.track_info;
    const statusRaw = ti?.latest_status?.status || "Unknown";
    const status = mapStatus(statusRaw);
    const events = extractEvents(ti);

    const providerName =
      ti?.tracking?.providers?.[0]?.provider?.name ||
      ti?.tracking?.providers?.[0]?.provider?.alias ||
      "Unknown carrier";

    res.json({
      tracking_number: number,
      status,
      status_raw: statusRaw,
      carrier: providerName,
      events,
      // Можно вернуть и всё сырьё — на время дебага:
      // raw: item
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

// SPA fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`✅ 17TRACK v2.4 API on http://localhost:${port}`);
});
