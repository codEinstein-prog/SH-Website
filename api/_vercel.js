export async function createWebRequest(req) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host || "localhost";
  const requestUrl = new URL(req.url || "/", protocol + "://" + host);
  const headers = new Headers();

  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      headers.set(name, value.join(", "));
    } else if (value !== undefined) {
      headers.set(name, value);
    }
  }

  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await readRequestBody(req);

  return new Request(requestUrl, {
    method: req.method,
    headers,
    body: body || undefined,
  });
}

export async function sendWebResponse(webResponse, res) {
  res.statusCode = webResponse.status;

  webResponse.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const responseBody = await webResponse.arrayBuffer();
  res.end(Buffer.from(responseBody));
}

export function createVercelHandler(handler) {
  return async function vercelHandler(req, res) {
    try {
      const request = await createWebRequest(req);
      if (request.method === "OPTIONS") {
        await sendWebResponse(
          new Response(null, {
            status: 204,
            headers: { Allow: "GET, POST, OPTIONS" },
          }),
          res
        );
        return;
      }

      const response = await handler({
        request,
        env: process.env,
      });
      await sendWebResponse(response, res);
    } catch (error) {
      console.error("Vercel API handler failed:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error.",
      });
    }
  };
}

export function isAllowedOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;

  const allowedOrigins = (
    process.env.FRONTEND_ORIGIN ||
    "https://codeinstein-prog.github.io"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return allowedOrigins.includes(origin);
}

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
