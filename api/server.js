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
  "17token": process.env.EXPO_PUBLIC_SEVENTEEN_API_KEY?.trim() || "",
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

// ---- Fallback: Nova Poshta API ----
async function trackNovaPoshta(number) {
  try {
    const r = await fetch("https://api.novaposhta.ua/v2.0/json/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: process.env.NP_API_KEY || "",
        modelName: "TrackingDocument",
        calledMethod: "getStatusDocuments",
        methodProperties: { Documents: [{ DocumentNumber: number }] },
      }),
    });
    const json = await r.json();
    const info = json.data?.[0];
    if (!info) return null;

    return {
      tracking_number: number,
      carrier: "Nova Poshta",
      status: info.Status,
      events: [
        {
          time: info.DateCreated,
          description: info.Status,
          location: info.CityRecipient || info.CitySender || "",
        },
      ],
    };
  } catch (err) {
    console.error("Nova Poshta fallback error:", err);
    return null;
  }
}

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

    // ---- 17TRACK helpers ----
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
      console.log(`🛰 Register ${number} (${carrierCode})`);
      const r = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers,
        body: JSON.stringify([{ number, carrier: carrierCode }]),
      });
      return r.json().catch(() => ({}));
    };

    const retrackNumber = async (carrierCode) => {
      console.log(`🔁 Retrack ${number} (${carrierCode})`);
      const r = await fetch(`${API_BASE}/retrack`, {
        method: "POST",
        headers,
        body: JSON.stringify([{ number, carrier: carrierCode }]),
      });
      return r.json().catch(() => ({}));
    };

    // ---- 1. первичная попытка ----
    let json = await tryOnce(carrier);
    console.log("📊 gettrackinfo:", JSON.stringify(json));
    let item = json?.data?.accepted?.[0];

    // ---- 2. регистрация при необходимости ----
    let rejectedEntry = json?.data?.rejected?.[0] || json?.data?.rejected;
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
      await registerNumber(carrier);
      await retrackNumber(carrier);
      console.log("⏳ Wait 20s before retry...");
      await new Promise((r) => setTimeout(r, 20000));
      json = await tryOnce(carrier);
      item = json?.data?.accepted?.[0];
    }

    // ---- 3. Повторные проверки ----
    let attempts = 0;
    while (!item && attempts < 2) {
      console.log(`🔄 Attempt ${attempts + 1} retry check...`);
      await new Promise((r) => setTimeout(r, 15000));
      json = await tryOnce(carrier);
      item = json?.data?.accepted?.[0];
      attempts++;
    }

    // ---- 4. Если данных нет — fallback на Nova Poshta ----
    if (!item && carrier === 5053) {
      console.log("⚙️ Using Nova Poshta fallback...");
      const np = await trackNovaPoshta(number);
      if (np) return res.json(np);
    }

    // ---- 5. Всё ещё нет данных ----
    if (!item) {
      console.log("⚠️ No tracking data yet.");
      return res.status(200).json({
        tracking_number: number,
        carrier: carrierQ || "Auto Detect",
        status: "Pending",
        message: "Трек зарегистрирован, ожидаем обновления.",
        events: [],
      });
    }

    // ---- 6. Есть данные ----
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
