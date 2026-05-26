// /api/track.js
const API_BASE = "https://api.17track.net/track/v2.4";

function makeHeaders() {
  console.log(
    "API KEY:",
    process.env.EXPO_PUBLIC_SEVENTEEN_API_KEY
  );

  return {
    "Content-Type": "application/json",
    "17token": (
      process.env.EXPO_PUBLIC_SEVENTEEN_API_KEY || ""
    ).trim(),
  };
}

function guessCarrier(num, explicit) {
  // Если пользователь передал carrier явно → используем его
  if (explicit) return Number(explicit);

  // 🧠 Если включён авто поиск — вернём null, чтобы API сам определил
  return null;
}

const STATUS_MAP = {
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

function mapStatus(s) {
  return STATUS_MAP[s] || s || "Unknown";
}

// ---- events ----
// Берём ISO-время в приоритете: time_utc -> time_iso -> time -> message_time
function extractEvents(trackInfo) {
  const providers = trackInfo?.tracking?.providers || [];
  const events = [];
  for (const p of providers) {
    for (const e of p?.events || []) {
      const t =
        e.time_utc ||
        e.time_iso ||
        e.time ||
        e.message_time ||
        null;

      events.push({
        time: t, // уже ISO или близко к нему
        description: e.description || e.message || "",
        location:
          e.location ||
          e.address?.city ||
          "",
        stage: e.stage || "",
        raw_status: e.status || e.sub_status || "",
      });
    }
  }
  events.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  return events;
}

async function safeFetchJSON(url, options) {
  const r = await fetch(url, options);
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("Invalid JSON from 17Track:", text.slice(0, 200));
    return {};
  }
}

// ---- API calls ----
async function tryOnce(number, carrier) {
  return safeFetchJSON(`${API_BASE}/gettrackinfo`, {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify([{ number, carrier }]),
  });
}

async function registerNumber(number, carrier) {
  return safeFetchJSON(`${API_BASE}/register`, {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify([{ number, carrier }]),
  });
}

// fallback для стран/городов (если в shipping_info пусто)
async function getTrackList(number, carrier) {
  return safeFetchJSON(`${API_BASE}/gettracklist`, {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify({
      number,
      carrier,
      data_origin: "Api",
      page_no: 1,
      order_by: "TrackTimeDesc",
    }),
  });
}

export default async function handler(req, res) {
  try {
    if (!process.env.EXPO_PUBLIC_SEVENTEEN_API_KEY) {
      return res.status(500).json({ error: "EXPO_PUBLIC_SEVENTEEN_API_KEY is not set is not set" });
    }

    const number = String(req.query.number || "").trim();
    if (!number) {
      return res.status(400).json({ error: "Tracking number required" });
    }

    const carrierQ = req.query.carrier ? String(req.query.carrier) : undefined;
    const carrier = guessCarrier(number, carrierQ);

    // 1) Основной запрос
    let json;
if (carrier === null) {
  json = await safeFetchJSON(`${API_BASE}/gettrackinfo`, {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify([{ number, auto_detection: true }]),
  });
} else {
  json = await tryOnce(number, carrier);
}
    let item =
  json?.data?.accepted?.[0] ||
  json?.data?.[0] ||
  json?.accepted?.[0] ||
  json?.[0] ||
  null;

  const rejMsg =
  json?.data?.rejected?.[0]?.error?.message ||
  json?.data?.rejected?.[0]?.message ||
  "";

// если трек не зарегистрирован → регистрируем
if (!item && rejMsg.includes("does not register")) {
  console.log("Registering tracking number...");

  await registerNumber(number, carrier);

  await new Promise((r) => setTimeout(r, 3000));

  json =
    carrier === null
      ? await safeFetchJSON(`${API_BASE}/gettrackinfo`, {
          method: "POST",
          headers: makeHeaders(),
          body: JSON.stringify([{ number, auto_detection: true }]),
        })
      : await tryOnce(number, carrier);

  item =
    json?.data?.accepted?.[0] ||
    json?.data?.[0] ||
    json?.accepted?.[0] ||
    json?.[0] ||
    null;
}

// остальные ошибки
if (!item && json?.data?.rejected?.length) {
  console.warn("17track rejected:", json.data.rejected[0]);

  return res.status(404).json({
    error: "not_found",
    message:
      json.data.rejected[0]?.error?.message ||
      "Трек-номер не найден или имеет неверный формат.",
  });
}



    // 3) Если данных всё ещё нет
    if (!item) {
      return res.status(200).json({
        tracking_number: number,
        carrier: carrierQ || "Auto Detect",
        status: "Pending",
        message: "Трек зарегистрирован, ожидаем обновления.",
        events: [],
        raw: json,
      });
    }

    // 4) Извлекаем из track_info
    const ti = item.track_info || {};
    const shippingInfo = ti.shipping_info || {};
    const statusRaw = ti?.latest_status?.status || "Unknown";
    const providerName =
      ti?.tracking?.providers?.[0]?.provider?.name ||
      ti?.tracking?.providers?.[0]?.provider?.alias ||
      "Unknown carrier";

    // Города/страны из официальных полей
    let origin_country =
      shippingInfo.shipper_address?.country ||
      ti.origin_country_name ||
      null;
    let origin_city = shippingInfo.shipper_address?.city || null;

    let destination_country =
      shippingInfo.recipient_address?.country ||
      ti.destination_country_name ||
      null;
    let destination_city = shippingInfo.recipient_address?.city || null;

    // События
    const events = extractEvents(ti);

    // На фронте ты берёшь начало/конец по событиям — сразу положим готовые
    const end_time = events[0]?.time || null; // самое новое
    const start_time = events.length
      ? events[events.length - 1]?.time || null
      : null;

    // 5) Fallback к gettracklist, если не хватило стран/городов
    if (!origin_country || !destination_country || !destination_city) {
      const listData = await getTrackList(number, carrier);
      const acc = listData?.data?.accepted?.[0] || {};

      origin_country =
        origin_country ||
        acc.shipping_country ||
        acc.origin_country ||
        null;

      destination_country =
        destination_country ||
        acc.recipient_country ||
        acc.destination_country ||
        null;

      destination_city = destination_city || acc.destination_city || null;
      // origin_city в gettracklist обычно лежит в shipper (иногда — имя/компания)
      origin_city = origin_city || acc.shipper || origin_city || null;
    }

    // 6) Ответ
    return res.status(200).json({
      tracking_number: number,
      carrier: providerName,
      status: mapStatus(statusRaw),

      // маршрут
      origin_country,
      origin_city,
      destination_country,
      destination_city,

      // события и границы времени
      events,
      start_time,
      end_time,

      status_raw: statusRaw,
    });
  } catch (err) {
    console.error("track error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Track handler failed" });
  }
}
