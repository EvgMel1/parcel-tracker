// api/track.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { number } = req.query;
    if (!number) {
      return res.status(400).json({ error: "Tracking number is required" });
    }

    const response = await fetch("https://api.17track.net/track/v2.4/gettrackinfo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "17token": process.env.SEVENTEEN_API_KEY,
      },
      body: JSON.stringify([{ number }]),
    });

    const data = await response.json();
    const item = data?.data?.accepted?.[0];

    if (!item) {
      return res.status(404).json({ error: "No tracking info found" });
    }

    res.status(200).json({
      tracking_number: number,
      status: item.track_info?.latest_status?.status || "Unknown",
      carrier: item.track_info?.tracking?.providers?.[0]?.provider?.name || "Unknown",
      events: item.track_info?.tracking?.providers?.[0]?.events || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
