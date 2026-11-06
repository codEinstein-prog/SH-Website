/**
 * Solar Harbour — Chatwoot Callback
 * Runtime: Vercel Node.js
 *
 * This endpoint acknowledges Chatwoot callbacks.
 * Messages are retrieved separately through /api/chat.
 *
 * It does not process or store callback payloads.
 */

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  return res.status(204).end();
}