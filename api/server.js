import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { createRequire } from "module";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const app = express();
const port = process.env.PORT || 3001;

// ---- Middleware ----
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));
app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "https://parcel-tracker-mauve.vercel.app",
      "https://parcel-tracker.vercel.app",
      "https://sb18uydrxic-45cz--3001--cf284e50.local-corp.webcontainer.io",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// ---- Helpers ----
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
  providers.forEach((p) => {
    (p.events || []).forEach((e) => {
      events.push({
        time: e.time || e.message_time || null,
        description: e.description || e.message || "",
        location: e.location || "",
        raw_status: e.status || "",
      });
    });
  });
  events.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  return events;
};

// ---- 17TRACK Base Config ----
const API_BASE = "https://api.17track.net/track/v2.4";

// ✅ функция для корректного создания заголовков (иначе Node их обрезает)
const makeHeaders = () => {
  const headers = new fetch.Headers();
  headers.append("Content-Type", "application/json");
  headers.append("17token", process.env.SEVENTEEN_API_KEY?.trim() || "");
  return headers;
};

// ---- API: /api/carriers ----
let carriersCache = null;
let lastFetchTime = 0;

app.get("/api/carriers", async (req, res) => {
  try {
    const now = Date.now();
    if (carriersCache && now - lastFetchTime < 12 * 60 * 60 * 1000) {
      return res.json({ source: "cache", data: carriersCache });
    }

    console.log("📦 Fetching carrier list from 17TRACK...");
    const r = await fetch(`${API_BASE}/carriers`, {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({}),
    });

    const text = await r.text();
    console.log("Carrier raw response:", text);
    const json = JSON.parse(text);

    if (json.code !== 0) {
      console.error("17TRACK carrier API error:", json);
      return res.status(500).json(json);
    }

    const list = (json?.data || []).map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      country: c.country,
      site: c.site,
    }));

    carriersCache = list;
    lastFetchTime = now;
    res.json({ source: "api", count: list.length, data: list });
  } catch (err) {
    console.error("Carrier list error:", err);
    res.status(500).json({ error: "Failed to load carriers" });
  }
});

// ---- API: /api/track ----
app.get("/api/track", async (req, res) => {
  try {
    const number = String(req.query.number || "").trim();
    if (!number)
      return res.status(400).json({ error: "Tracking number required" });

    const carrierQ = req.query.carrier ? String(req.query.carrier) : undefined;
    const primaryCarrier = guessCarrier(number, carrierQ);

    console.log("🔍 Requesting track info:", number, "carrier:", primaryCarrier);

    const tryOnce = async (carrierCode) => {
      const r = await fetch(`${API_BASE}/gettrackinfo`, {
        method: "POST",
        headers: makeHeaders(),
        body: JSON.stringify([{ number, carrier: carrierCode }]),
      });
      const text = await r.text();
      try {
        return JSON.parse(text);
      } catch {
        console.error("Invalid JSON from 17TRACK:", text);
        throw new Error("Invalid JSON from 17TRACK");
      }
    };

    const registerNumber = async (number, carrier) => {
      console.log("📝 Registering tracking number...");
      const r = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: makeHeaders(),
        body: JSON.stringify([{ number, carrier }]),
      });
      return r.json();
    };

    // Step 1 — initial try
    let json = await tryOnce(primaryCarrier);
    let accepted = json?.data?.accepted || [];
    let item = accepted[0];

    // Step 2 — register if needed
    if (
      !item &&
      json?.data?.rejected?.[0]?.error?.message?.includes("does not register")
    ) {
      await registerNumber(number, primaryCarrier);
      await new Promise((r) => setTimeout(r, 5000));
      json = await tryOnce(primaryCarrier);
      accepted = json?.data?.accepted || [];
      item = accepted[0];
    }

    // Step 3 — still nothing
    if (!item) {
      return res.status(200).json({
        tracking_number: number,
        status: "Registered",
        message: "Tracking number registered, please check again shortly.",
      });
    }

    // Step 4 — success
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
    });
  } catch (err) {
    console.error("Track API error:", err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

// ---- SPA Fallback ----
app.use((req, res, next) => {
  if (req.url.startsWith("/api/")) return next();

  const indexPath = path.join(__dirname, "dist", "index.html");
  fs.access(indexPath, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).send("index.html not found");
    } else {
      res.sendFile(indexPath);
    }
  });
});

// ---- Export for Vercel ----
export default app;
