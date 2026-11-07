
import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

/*
 * Solar Harbour — Chatwoot Website Chat API
 * Runtime: Vercel Node.js
 *
 * GET  /api/chat  -> Retrieve messages
 * POST /api/chat  -> Send a visitor message
 * OPTIONS        -> CORS preflight
 *
 * Authentication:
 * - Signed session token via Authorization header
 * - HttpOnly session cookie fallback
 *
 * Required environment variables:
 * CHATWOOT_BASE_URL
 * CHATWOOT_SITE_API_INBOX_IDENTIFIER
 * CHAT_SESSION_SECRET
 */

const COOKIE_NAME = "site_chat_v2";
const SESSION_VERSION = 3;
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
const MAX_MESSAGE_LENGTH = 4000;
const UPSTREAM_TIMEOUT = 15000;

const DEFAULT_ORIGIN =
  "https://solarhabour.ng-support-staff.uk";

const QUICK_QUESTIONS = [
  "quote",
  "services",
  "consultation",
  "agent",
];

/* -------------------------------
   CONFIGURATION
-------------------------------- */

function getConfig() {
  const baseUrl = (
    process.env.CHATWOOT_BASE_URL ||
    "https://app.chatwoot.com"
  ).replace(/\/+$/, "");

  const inbox = (
    process.env.CHATWOOT_SITE_API_INBOX_IDENTIFIER ||
    ""
  ).trim();

  const secret = process.env.CHAT_SESSION_SECRET || "";

  const origins = (
    process.env.CHAT_ALLOWED_ORIGINS || DEFAULT_ORIGIN
  )
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  if (
    !/^https:\/\/[^/?#]+$/i.test(baseUrl) ||
    !inbox ||
    secret.length < 32
  ) {
    throw new ApiError(
      503,
      "CHAT_CONFIGURATION_MISSING",
      "Chat configuration is incomplete."
    );
  }

  return {
    baseUrl,
    inbox,
    secret,
    origins,
    apiBase:
      `${baseUrl}/public/api/v1/inboxes/` +
      encodeURIComponent(inbox),
  };
}

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/* -------------------------------
   CORS
-------------------------------- */

function applyCors(req, res, origins) {
  const origin = req.headers.origin;

  if (origin && origins.includes(origin)) {
    res.setHeader(
      "Access-Control-Allow-Origin",
      origin
    );
    res.setHeader(
      "Access-Control-Allow-Credentials",
      "true"
    );
  }

  res.setHeader("Vary", "Origin");

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  res.setHeader("Cache-Control", "no-store");
}

function checkOrigin(req, origins) {
  const origin = req.headers.origin;

  // Non-browser requests (e.g. PowerShell) may omit Origin.
  if (!origin) return;

  if (!origins.includes(origin)) {
    throw new ApiError(
      403,
      "ORIGIN_NOT_ALLOWED",
      "This website is not permitted to access chat."
    );
  }
}

/* -------------------------------
   RESPONSE HELPERS
-------------------------------- */

function json(res, status, data) {
  return res.status(status).json(data);
}

function normalizeError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  console.error(
    "Unexpected chat error:",
    error?.message || "Unknown error"
  );

  return new ApiError(
    500,
    "INTERNAL_ERROR",
    "An unexpected chat service error occurred."
  );
}

/* -------------------------------
   SIGNED SESSIONS
-------------------------------- */

function sign(data, secret) {
  return createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
}

function createSessionToken(session, secret) {
  const payload = Buffer.from(
    JSON.stringify(session)
  ).toString("base64url");

  const signature = sign(payload, secret);

  return `${payload}.${signature}`;
}

function validateSessionToken(token, config) {
  try {
    if (
      typeof token !== "string" ||
      token.length > 4096
    ) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 2) return null;

    const [payload, signature] = parts;

    const expected = sign(
      payload,
      config.secret
    );

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }

    const session = JSON.parse(
      Buffer.from(
        payload,
        "base64url"
      ).toString("utf8")
    );

    if (
      session.v !== SESSION_VERSION ||
      session.inbox !== config.inbox ||
      typeof session.sourceId !== "string" ||
      !session.sourceId ||
      !Number.isSafeInteger(session.conversationId) ||
      session.conversationId < 1 ||
      !Number.isFinite(session.expires) ||
      session.expires <= Date.now()
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function readCookie(req) {
  const cookieHeader = req.headers.cookie || "";

  const entry = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) =>
      item.startsWith(`${COOKIE_NAME}=`)
    );

  if (!entry) return null;

  return entry.substring(COOKIE_NAME.length + 1);
}

function readSession(req, config) {
  const authorization = req.headers.authorization || "";

  if (authorization.startsWith("Bearer ")) {
    // An invalid explicit token must not fall back
    // to a different conversation's cookie.
    return validateSessionToken(
      authorization.substring(7).trim(),
      config
    );
  }

  const cookieToken = readCookie(req);

  if (!cookieToken) return null;

  return validateSessionToken(
    cookieToken,
    config
  );
}

function createSession(config, contact, conversation) {
  return {
    v: SESSION_VERSION,
    inbox: config.inbox,
    sourceId: contact.source_id,
    conversationId: conversation.id,
    expires: Date.now() + SESSION_MAX_AGE * 1000,
  };
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    [
      `${COOKIE_NAME}=${token}`,
      "HttpOnly",
      "Secure",
      "SameSite=None",
      "Path=/api/chat",
      `Max-Age=${SESSION_MAX_AGE}`,
    ].join("; ")
  );
}

/* -------------------------------
   CHATWOOT API CLIENT
-------------------------------- */

async function chatwoot(
  config,
  stage,
  path,
  method = "GET",
  body
) {
  const url = config.apiBase + path;

  let response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      ...(body === undefined
        ? {}
        : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      "Chatwoot connection error:",
      stage,
      error?.name
    );

    throw new ApiError(
      502,
      "CHATWOOT_CONNECTION_FAILED",
      `Chatwoot connection failed during ${stage}.`
    );
  }

  if (!response.ok) {
    console.error(
      "Chatwoot upstream failure:",
      stage,
      response.status
    );

    throw new ApiError(
      502,
      "CHATWOOT_UPSTREAM_ERROR",
      `Chatwoot rejected the ${stage} request (HTTP ${response.status}).`
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      502,
      "CHATWOOT_INVALID_RESPONSE",
      `Chatwoot returned invalid JSON during ${stage}.`
    );
  }

  return data;
}

/* -------------------------------
   CONVERSATION HELPERS
-------------------------------- */

function conversationPath(session) {
  return (
    `/contacts/${encodeURIComponent(session.sourceId)}` +
    `/conversations/${session.conversationId}`
  );
}

async function createConversation(config) {
  const contact = await chatwoot(
    config,
    "create_contact",
    "/contacts",
    "POST",
    {
      name: "Website Visitor",
    }
  );

  if (
    !contact ||
    typeof contact.source_id !== "string" ||
    !contact.source_id
  ) {
    throw new ApiError(
      502,
      "INVALID_CONTACT_RESPONSE",
      "Chatwoot did not return a valid contact."
    );
  }

  const path =
    `/contacts/${encodeURIComponent(contact.source_id)}` +
    "/conversations";

  const conversation = await chatwoot(
    config,
    "create_conversation",
    path,
    "POST",
    {
      custom_attributes: {},
    }
  );

  if (
    !Number.isSafeInteger(conversation?.id) ||
    conversation.id < 1
  ) {
    throw new ApiError(
      502,
      "INVALID_CONVERSATION_RESPONSE",
      "Chatwoot did not return a valid conversation."
    );
  }

  return createSession(
    config,
    contact,
    conversation
  );
}

/* -------------------------------
   MESSAGE NORMALIZATION
-------------------------------- */

function normalizeMessage(message) {
  const rawType = message.message_type;

  const messageType =
    rawType === 0 || rawType === "0" ||
    rawType === "incoming"
      ? "incoming"
      : rawType === 1 || rawType === "1" ||
        rawType === "outgoing"
        ? "outgoing"
        : "other";

  return {
    id: message.id,
    content: message.content || "",
    messageType,
    message_type: messageType,
    createdAt: message.created_at,
    created_at: message.created_at,
    private: Boolean(message.private),
  };
}

function extractMessages(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.payload)) {
    return data.payload;
  }

  if (Array.isArray(data?.messages)) {
    return data.messages;
  }

  if (Array.isArray(data?.data?.payload)) {
    return data.data.payload;
  }

  throw new ApiError(
    502,
    "INVALID_MESSAGE_LIST",
    "Chatwoot returned an unrecognized message list."
  );
}

function sortTimestamp(value) {
  if (typeof value === "number") return value;

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed / 1000 : 0;
}

function getVisibleMessages(data) {
  const entries = extractMessages(data);

  return entries
    .map(normalizeMessage)
    .filter((message) =>
      ["incoming", "outgoing"].includes(
        message.messageType
      ) &&
      typeof message.content === "string" &&
      message.content.trim().length > 0 &&
      !message.private
    )
    .sort(
      (a, b) =>
        sortTimestamp(a.createdAt) -
        sortTimestamp(b.createdAt)
    );
}

/* -------------------------------
   GET MESSAGE HISTORY
-------------------------------- */

async function handleGet(req, res, config) {
  const session = readSession(req, config);

  if (!session) {
    return json(res, 200, {
      connected: false,
      conversationId: null,
      messages: [],
      sessionExpired: true,
    });
  }

  const path =
    conversationPath(session) + "/messages";

  const data = await chatwoot(
    config,
    "get_messages",
    path
  );

  const messages = getVisibleMessages(data);

  console.log("Chat history retrieved:", {
    conversationId: session.conversationId,
    messageCount: messages.length,
  });

  const token = createSessionToken(
    session,
    config.secret
  );

  return json(res, 200, {
    success: true,
    connected: true,
    conversationId: session.conversationId,
    sessionToken: token,
    messages,
  });
}

/* -------------------------------
   POST VISITOR MESSAGE
-------------------------------- */

async function handlePost(req, res, config) {
  const contentType =
    req.headers["content-type"] || "";

  if (
    !contentType.toLowerCase().startsWith(
      "application/json"
    )
  ) {
    throw new ApiError(
      415,
      "INVALID_CONTENT_TYPE",
      "Expected application/json."
    );
  }

  let body = req.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      throw new ApiError(
        400,
        "INVALID_JSON",
        "Invalid JSON request."
      );
    }
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    throw new ApiError(
      400,
      "INVALID_BODY",
      "A valid request body is required."
    );
  }

  const content =
    typeof body.message === "string"
      ? body.message.trim()
      : "";

  if (
    !content ||
    content.length > MAX_MESSAGE_LENGTH
  ) {
    throw new ApiError(
      400,
      "INVALID_MESSAGE",
      "Message must contain 1–4000 characters."
    );
  }

  if (
    !["message", "quick_question"].includes(
      body.type
    )
  ) {
    throw new ApiError(
      400,
      "INVALID_MESSAGE_TYPE",
      "Unsupported message type."
    );
  }

  if (
    body.type === "quick_question" &&
    !QUICK_QUESTIONS.includes(body.optionId)
  ) {
    throw new ApiError(
      400,
      "INVALID_QUICK_QUESTION",
      "Unknown quick question."
    );
  }

  let session = readSession(req, config);

  if (!session) {
    session = await createConversation(config);
  }

  const token = createSessionToken(
    session,
    config.secret
  );

  // Set cookie before sending, so it is available
  // even if Chatwoot later returns an error.
  setSessionCookie(res, token);

  const path =
    conversationPath(session) + "/messages";

  const sent = await chatwoot(
    config,
    "send_message",
    path,
    "POST",
    { content }
  );

  if (!sent?.id) {
    throw new ApiError(
      502,
      "INVALID_SEND_RESPONSE",
      "Chatwoot did not confirm the message."
    );
  }

  const message = normalizeMessage(sent);

  console.log("Chat message sent:", {
    conversationId: session.conversationId,
    messageId: message.id,
  });

  return json(res, 200, {
    success: true,
    connected: true,
    conversationId: session.conversationId,
    sessionToken: token,
    message,
  });
}

/* -------------------------------
   VERCEL ENTRYPOINT
-------------------------------- */

export default async function handler(req, res) {
  let config;

  try {
    config = getConfig();

    applyCors(
      req,
      res,
      config.origins
    );

    checkOrigin(
      req,
      config.origins
    );

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (req.method === "GET") {
      return await handleGet(
        req,
        res,
        config
      );
    }

    if (req.method === "POST") {
      return await handlePost(
        req,
        res,
        config
      );
    }

    res.setHeader(
      "Allow",
      "GET, POST, OPTIONS"
    );

    return json(res, 405, {
      success: false,
      error: "Method not allowed.",
    });
  } catch (error) {
    const failure = normalizeError(error);

    console.error("Chat API failure:", {
      status: failure.status,
      code: failure.code,
    });

    // Preserve configured CORS for error responses.
    if (config) {
      applyCors(req, res, config.origins);
    }

    return json(res, failure.status, {
      success: false,
      error: failure.message,
      code: failure.code,
    });
  }
}
