
 // Cloudflare Pages: functions/api/chat.js

const NAME = "site_chat";
const TTL_SECONDS = 30 * 86400;

const respond = (data, status = 200, cookie) => {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });

  if (cookie) {
    headers.set("Set-Cookie", cookie);
  }

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
};

// Base64 URL encoding
const enc = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

// Base64 URL decoding
const dec = (str) =>
  Uint8Array.from(
    atob(str.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

// Create HMAC signing key
async function key(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"]
  );
}

// Generate signed session cookie
async function cookieFor(session, secret) {
  const data = enc(
    new TextEncoder().encode(JSON.stringify(session))
  );

  const signature = enc(
    new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        await key(secret),
        new TextEncoder().encode(data)
      )
    )
  );

  return [
    `${NAME}=${data}.${signature}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/api/chat",
    `Max-Age=${TTL_SECONDS}`,
  ].join("; ");
}

// Retrieve and verify existing conversation session
async function readSession(request, secret) {
  try {
    const value = (request.headers.get("Cookie") || "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(`${NAME}=`))
      ?.slice(NAME.length + 1);

    if (!value) return null;

    const parts = value.split(".");

    if (parts.length !== 2) return null;

    const valid = await crypto.subtle.verify(
      "HMAC",
      await key(secret),
      dec(parts[1]),
      new TextEncoder().encode(parts[0])
    );

    if (!valid) return null;

    const session = JSON.parse(
      new TextDecoder().decode(dec(parts[0]))
    );

    return (
      typeof session.sourceId === "string" &&
      /^[1-9]\d*$/.test(String(session.conversationId)) &&
      session.exp > Date.now()
    )
      ? session
      : null;
  } catch {
    return null;
  }
}

// Validate Cloudflare environment configuration
function configuration(env) {
  const base = (
    env.CHATWOOT_BASE_URL ||
    "https://app.chatwoot.com"
  ).replace(/\/+$/, "");

  if (
    !base.startsWith("https://") ||
    !env.CHATWOOT_WEBSITE_TOKEN ||
    !env.CHAT_SESSION_SECRET ||
    env.CHAT_SESSION_SECRET.length < 32
  ) {
    throw new Error("Missing or invalid configuration");
  }

  return {
    base,
    inbox: encodeURIComponent(
      env.CHATWOOT_WEBSITE_TOKEN
    ),
    secret: env.CHAT_SESSION_SECRET,
  };
}

// Make requests to Chatwoot Public API

async function chatwoot(cfg, path, method = "GET", body) {
  const url =
    `${cfg.base}/public/api/v1/inboxes/${cfg.inbox}${path}`;

  console.log("CHATWOOT REQUEST:", {
    method,
    path,
  });

  let response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      ...(body === undefined
        ? {}
        : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    console.error("CHATWOOT NETWORK ERROR:", error.message);
    throw new Error("Chatwoot network connection failed");
  }

  const responseText = await response.text();

  console.log("CHATWOOT RESPONSE STATUS:", response.status);

  if (!response.ok) {
    // Never print message content or contact details
    // into production logs.
    console.error("CHATWOOT FAILED:", {
      method,
      path,
      status: response.status,
    });

    throw new Error(
      `Chatwoot ${method} ${path} failed: HTTP ${response.status}`
    );
  }

  try {
    return responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error("Chatwoot returned invalid JSON");
  }
}


// Generate Chatwoot conversation API path
function pathFor(session) {
  return (
    `/contacts/${encodeURIComponent(session.sourceId)}` +
    `/conversations/${session.conversationId}`
  );
}

// Standardize message response for React frontend
function normalize(m) {
  return {
    id: m.id,
    content: m.content || "",
    messageType: m.message_type,
    createdAt: m.created_at,
  };
}

// ======================================================
// GET /api/chat
// Retrieve existing conversation and agent responses
// ======================================================

export async function onRequestGet({ request, env }) {
  try {
    const cfg = configuration(env);

    const session = await readSession(
      request,
      cfg.secret
    );

    if (!session) {
      return respond({
        connected: false,
        messages: [],
      });
    }

    const result = await chatwoot(
      cfg,
      `${pathFor(session)}/messages`
    );

    const list = Array.isArray(result)
      ? result
      : Array.isArray(result?.payload)
        ? result.payload
        : [];

    const messages = list
      .filter(
        (m) =>
          [
            0,
            1,
            "incoming",
            "outgoing",
          ].includes(m.message_type) &&
          typeof m.content === "string" &&
          m.content.trim() &&
          !m.private
      )
      .map(normalize)
      .sort(
        (a, b) =>
          Number(a.createdAt) -
          Number(b.createdAt)
      );

    return respond({
      connected: true,
      messages,
    });
  } catch (error) {
    console.error("chat GET", error.message);

    return respond(
      {
        error: "Could not retrieve conversation.",
      },
      502
    );
  }
}

// ======================================================
// POST /api/chat
// Create conversation (if necessary) and send message
// ======================================================

export async function onRequestPost({
  request,
  env,
}) {
  // Only allow requests from the same website origin
  const origin = request.headers.get("Origin");

  if (
    origin &&
    origin !== new URL(request.url).origin
  ) {
    return respond(
      { error: "Origin not allowed" },
      403
    );
  }

  try {
    const cfg = configuration(env);

    let body;

    try {
      body = await request.json();
    } catch {
      return respond(
        { error: "Invalid JSON" },
        400
      );
    }

    const message = String(
      body?.message || ""
    ).trim();

    // Validate message length
    if (
      !message ||
      message.length > 4000
    ) {
      return respond(
        {
          error: "Message must be 1–4000 characters",
        },
        400
      );
    }

    // Support existing widget message types
    if (
      ![
        "message",
        "quick_question",
      ].includes(body?.type)
    ) {
      return respond(
        { error: "Unsupported message type" },
        400
      );
    }

    // Validate existing quick question options
    if (
      body.type === "quick_question" &&
      ![
        "quote",
        "services",
        "consultation",
        "agent",
      ].includes(body.optionId)
    ) {
      return respond(
        { error: "Invalid option" },
        400
      );
    }

    // Recover existing signed session
    let session = await readSession(
      request,
      cfg.secret
    );

    // Create new contact and conversation
    if (!session) {
      const contact = await chatwoot(
        cfg,
        "/contacts",
        "POST",
        {
          name: "Website Visitor",
        }
      );

      if (!contact?.source_id) {
        throw new Error(
          "Contact did not return source_id"
        );
      }

      const conversation = await chatwoot(
        cfg,
        `/contacts/${encodeURIComponent(
          contact.source_id
        )}/conversations`,
        "POST",
        {}
      );

      if (!conversation?.id) {
        throw new Error(
          "Conversation did not return id"
        );
      }

      session = {
        sourceId: contact.source_id,
        conversationId: conversation.id,
        exp:
          Date.now() +
          TTL_SECONDS * 1000,
      };
    }

    // Send visitor message to Chatwoot
    const result = await chatwoot(
      cfg,
      `${pathFor(session)}/messages`,
      "POST",
      {
        content: message,
      }
    );

    // Return message confirmation
    return respond(
      {
        success: true,
        message: normalize(result),
        conversationId:
          session.conversationId,
      },
      200,
      await cookieFor(
        session,
        cfg.secret
      )
    );
  } catch (error) {
    console.error(
      "chat POST",
      error.message
    );

    return respond(
      {
        error:
          "Chat service could not send message; check history before retrying.",
      },
      502
    );
  }
}
