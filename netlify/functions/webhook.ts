import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    // логируем, валидируй подписку провайдера по желанию
    return json({ ok: true, received: body });
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
