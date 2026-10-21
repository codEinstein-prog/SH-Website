import { Readable } from "node:stream";
import { onRequestPost } from "../functions/api/booking.js";

// Run the same Pages Function locally, keeping credentials on the server.
export function bookingApiPlugin(env) {
  function install(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url?.split("?")[0] !== "/api/booking") return next();

      if (req.method !== "POST") {
        res.writeHead(405, { Allow: "POST", "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Method not allowed." }));
        return;
      }

      try {
        const protocol = req.socket.encrypted ? "https" : "http";
        const request = new Request(`${protocol}://${req.headers.host}${req.url}`, {
          method: req.method,
          headers: req.headers,
          body: Readable.toWeb(req),
          duplex: "half",
        });
        const response = await onRequestPost({ request, env });
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(await response.text());
      } catch {
        res.writeHead(500, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        res.end(JSON.stringify({ success: false, error: "Booking is temporarily unavailable." }));
      }
    });
  }

  return {
    name: "local-booking-api",
    configureServer: install,
    configurePreviewServer: install,
  };
}
