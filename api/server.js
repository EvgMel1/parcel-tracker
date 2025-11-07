import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));
app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "https://parcel-tracker-mauve.vercel.app",
      "https://parcel-tracker.vercel.app",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// ---- Helpers ----
const API_BASE = "https://api.17track.net/track/v2.4";

const makeHeaders = () => ({
  "Content-Type": "application/json",
  "17token": process.env.SEVENTEEN_API_KEY?.trim() || "",
});

const guessCarrier = (num, explicit) => {
  if (explicit) return Number(explicit);
  if (/^[A-Z]{2}\d{9}CN$/i.test(num)) return 3011; // China Post
  return 100003; // Auto detect
};

const mapStatus = (raw) => {
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
  const providers = trackInfo?.tracking?.providers || [];
  const events = [];
  providers.forEach((p) =>
    (p.events || []).forEach((e) =>
      events.push({
        time: e.time || e.message_time || null,
        description: e.description || e.message || "",
        location: e.location || "",
        raw_status: e.status || "",
      })
    )
  );
  events.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  return events;
};

// ---- Carriers ----
app.get("/api/carriers", async (req, res) => {
  const carriers = [
    { id: 100003, name: "Auto Detect", country: "Global" },
    { id: 5053, name: "Nova Poshta", country: "UA" },
    { id: 5006, name: "DHL", country: "DE" },
    { id: 5004, name: "FedEx", country: "US" },
    { id: 5002, name: "UPS", country: "US" },
    { id: 3011, name: "China Post", country: "CN" },
  ];
  res.json({ source: "local", count: carriers.length, data: carriers });
});

// ---- TRACK ----
app.get("/api/track", async (req, res) => {
  try {
    const number = String(req.query.number || "").trim();
    if (!number)
      return res.status(400).json({ error: "Tracking number required" });

    const carrierQ = req.query.carrier ? String(req.query.carrier) : undefined;
    const carrier = guessCarrier(number, carrierQ);
    const headers = makeHeaders();

    const tryOnce = async (carrierCode) => {
      const r = await fetch(`${API_BASE}/gettrackinfo`, {
        method: "POST",
        headers,
        body: JSON.stringify([{ number, carrier: carrierCode }]),
      });
      const text = await r.text();
      try {
        return JSON.parse(text);
      } catch {
        console.error("Invalid JSON from 17TRACK:", text);
        return {};
      }
    };

    const registerNumber = async (carrierCode) => {
      console.log(`🛰 Отправляем /register для ${number} (${carrierCode})`);
      const r = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers,
        body: JSON.stringify([{ number, carrier: carrierCode }]),
      });
      const text = await r.text();
      console.log("📦 Register response:", text);
      try {
        return JSON.parse(text);
      } catch {
        return {};
      }
    };

    // --- шаг 1: пробуем сразу ---
    let json = await tryOnce(carrier);
    console.log("📊 gettrackinfo response:", JSON.stringify(json));
    let item = json?.data?.accepted?.[0];

// --- шаг 2: если трек не зарегистрирован ---
let rejectedEntry = null;

// иногда rejected приходит объектом, иногда массивом
const rejectedData = json?.data?.rejected;
if (Array.isArray(rejectedData)) {
  rejectedEntry = rejectedData[0];
} else if (rejectedData && typeof rejectedData === "object") {
  rejectedEntry = rejectedData;
}

const err = rejectedEntry?.error || {};
const errMsg = String(err.message || "").toLowerCase();

const needRegister =
  !item &&
  (
    errMsg.includes("does not register") ||
    errMsg.includes("please register") ||
    errMsg.includes("register first") ||
    err.code === -18019902 ||
    err.code === -18019901 ||
    err.code === -18019900
  );

if (needRegister) {
  console.log(`⚙️ Требуется регистрация трека ${number} (carrier ${carrier})`);
  console.log("🛰 Отправляем запрос /register на 17TRACK...");

  const reg = await registerNumber(carrier);
  console.log("📦 Register response:", JSON.stringify(reg));

  console.log("⏳ Ожидание 6 секунд перед повторной проверкой...");
  await new Promise((r) => setTimeout(r, 6000));

  json = await tryOnce(carrier);
  item = json?.data?.accepted?.[0];
}

    

    // --- шаг 3: если данных всё ещё нет ---
    if (!item) {
      console.log("⚠️ Трек зарегистрирован, но данных нет.");
      return res.status(200).json({
        tracking_number: number,
        carrier: carrierQ || "Auto Detect",
        status: "Pending",
        message: "Трек зарегистрирован, ожидаем обновления.",
        events: [],
      });
    }

    // --- шаг 4: есть данные ---
    const ti = item.track_info;
    const statusRaw = ti?.latest_status?.status || "Unknown";
    const status = mapStatus(statusRaw);
    const events = extractEvents(ti);
    const providerName =
      ti?.tracking?.providers?.[0]?.provider?.name ||
      ti?.tracking?.providers?.[0]?.provider?.alias ||
      "Unknown carrier";

    return res.json({
      tracking_number: number,
      carrier: providerName,
      status,
      events,
    });
  } catch (err) {
    console.error("❌ Track API error:", err);
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
});

// ---- SPA fallback ----
app.use((req, res, next) => {
  if (req.url.startsWith("/api/")) return next();
  const indexPath = path.join(__dirname, "dist", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("index.html not found");
  }
});

export default app;
