// Optional Cloudflare Pages Function: functions/api/chatwoot-callback.js
// If the Chatwoot API inbox creation form REQUIRES a callback URL,
// configure https://YOUR-SITE.example/api/chatwoot-callback.
// This endpoint purposefully discards callbacks because the widget polls /api/chat.
// Do not use this as a message-ingestion endpoint without verifying webhook signatures.
export function onRequestPost() {
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
