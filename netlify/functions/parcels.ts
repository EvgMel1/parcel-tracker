import type { Handler } from "@netlify/functions";

let inMemory: any[] = [];

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      return json({ items: inMemory });
    }
    if (event.httpMethod === "POST") {
      const body = event.body ? JSON.parse(event.body) : {};
      const item = { id: cryptoRandom(), ...body, created_at: new Date().toISOString() };
      inMemory.unshift(item);
      return json(item, 201);
    }
    if (event.httpMethod === "DELETE") {
      const id = new URLSearchParams(event.rawQuery || "").get("id");
      if (!id) return json({ error: "id required" }, 400);
      inMemory = inMemory.filter((x) => x.id !== id);
      return json({ ok: true });
    }
    return json({ error: "Method not allowed" }, 405);
  } catch (e: any) {
    return json({ error: e.message || "Internal error" }, 500);
  }
};

function json(data: any, status = 200) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}
function cryptoRandom() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
