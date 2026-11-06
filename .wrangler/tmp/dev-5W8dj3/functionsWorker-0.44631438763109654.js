var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-IxCP9L/functionsWorker-0.44631438763109654.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var DAY_IN_MS = 24 * 60 * 60 * 1e3;
var appointmentTypes = /* @__PURE__ */ new Set([
  "Initial consultation",
  "Site visit",
  "Project follow-up"
]);
var services = /* @__PURE__ */ new Set([
  "Roofing",
  "Solar",
  "Impact windows",
  "Multiple services"
]);
var timeWindows = /* @__PURE__ */ new Set(["Morning", "Afternoon", "Flexible"]);
async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return jsonResponse({ success: false, error: "Origin not allowed." }, 403);
  }
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
    return jsonResponse({ success: false, error: "Expected application/json." }, 415);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON request." }, 400);
  }
  const booking = validateBooking(body);
  if (!booking.success) {
    return jsonResponse({ success: false, error: booking.error }, 400);
  }
  const apiKey = env.CALCOM_API_KEY?.trim();
  const eventTypeId = Number(env.CALCOM_EVENT_TYPE_ID);
  if (!apiKey || !Number.isSafeInteger(eventTypeId) || eventTypeId <= 0) {
    console.error("Cal.com booking configuration is missing or invalid.");
    return jsonResponse({
      success: false,
      error: "Online booking is temporarily unavailable. Please try again later."
    }, 503);
  }
  const { value } = booking;
  const dateStart = Date.parse(`${value.preferredDate}T00:00:00Z`);
  const rangeStart = Math.max(Date.now() + 1e3, dateStart - DAY_IN_MS);
  const rangeEnd = dateStart + 2 * DAY_IN_MS;
  const availabilityUrl = new URL(
    "https://api.cal.com/v2/slots"
  );
  availabilityUrl.searchParams.set("eventTypeId", String(eventTypeId));
  availabilityUrl.searchParams.set("timeZone", value.inviteeTimezone);
  availabilityUrl.searchParams.set("format", "range");
  availabilityUrl.searchParams.set(
    "start",
    new Date(rangeStart).toISOString()
  );
  availabilityUrl.searchParams.set(
    "end",
    new Date(rangeEnd).toISOString()
  );
  let availabilityResponse;
  try {
    availabilityResponse = await fetch(availabilityUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": "2024-09-04"
      },
      signal: AbortSignal.timeout(15e3)
    });
  } catch (error) {
    console.error("Cal.com availability request failed:", error.name);
    return jsonResponse({
      success: false,
      error: "We could not check appointment availability. Please try again."
    }, 502);
  }
  if (!availabilityResponse.ok) {
    console.error(
      "Cal.com availability request failed with HTTP status:",
      availabilityResponse.status
    );
    return jsonResponse({
      success: false,
      error: "We could not check appointment availability. Please try again."
    }, 502);
  }
  let availability;
  try {
    availability = await availabilityResponse.json();
  } catch (error) {
    console.error("Cal.com returned invalid availability data:", error.name);
    return jsonResponse({
      success: false,
      error: "We could not check appointment availability. Please try again."
    }, 502);
  }
  if (availability?.status !== "success" || !availability.data || typeof availability.data !== "object" || Array.isArray(availability.data) || !Object.values(availability.data).every(Array.isArray)) {
    console.error("Cal.com availability response did not include valid slots.");
    return jsonResponse({
      success: false,
      error: "We could not check appointment availability. Please try again."
    }, 502);
  }
  const matchingSlot = Object.values(availability.data).flat().filter((slot) => {
    const start = Date.parse(slot?.start);
    if (!Number.isFinite(start) || start < rangeStart || start >= rangeEnd) {
      return false;
    }
    const localTime = getLocalTimeParts(start, value.inviteeTimezone);
    if (localTime.date !== value.preferredDate) {
      return false;
    }
    if (value.preferredTime === "Morning") {
      return localTime.hour < 13;
    }
    if (value.preferredTime === "Afternoon") {
      return localTime.hour >= 13;
    }
    return true;
  }).sort(
    (first, second) => Date.parse(first.start) - Date.parse(second.start)
  )[0];
  if (!matchingSlot) {
    return jsonResponse({
      success: false,
      error: "No appointment times are available for that date and time window. Please choose another."
    }, 409);
  }
  const bookingPayload = {
    eventTypeId,
    start: new Date(matchingSlot.start).toISOString(),
    attendee: {
      name: value.fullName,
      email: value.email,
      timeZone: value.inviteeTimezone,
      language: "en"
    },
    bookingFieldsResponses: {
      notes: [
        `Appointment type: ${value.appointmentType}`,
        `Service: ${value.service}`,
        `Telephone number: ${value.phone}`,
        `Property address: ${value.propertyAddress || "Not provided"}`,
        `Additional information: ${value.notes || "None"}`
      ].join("\n")
    },
    metadata: {
      source: "website",
      appointmentType: value.appointmentType,
      service: value.service,
      phone: value.phone,
      propertyAddress: value.propertyAddress
    }
  };
  const internationalPhone = value.phone.replace(/[\s().-]/g, "");
  if (/^\+[1-9]\d{6,14}$/.test(internationalPhone)) {
    bookingPayload.attendee.phoneNumber = internationalPhone;
  }
  let bookingResponse;
  try {
    bookingResponse = await fetch("https://sh-website-ten.vercel.app/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": "2026-02-25",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bookingPayload),
      signal: AbortSignal.timeout(2e4)
    });
  } catch (error) {
    console.error("Cal.com booking request failed:", error.name);
    return jsonResponse({
      success: false,
      error: "We could not verify your booking. Please check your email before trying again."
    }, 502);
  }
  if (bookingResponse.status === 409) {
    return jsonResponse({
      success: false,
      error: "That appointment time is no longer available. Please choose another date or time window."
    }, 409);
  }
  if (!bookingResponse.ok) {
    console.error(
      "Cal.com booking request failed with HTTP status:",
      bookingResponse.status
    );
    return jsonResponse({
      success: false,
      error: "We could not confirm the appointment. Please check your email before trying again or contact us for help."
    }, 502);
  }
  let result;
  try {
    result = await bookingResponse.json();
  } catch {
  }
  if (result?.status !== "success" || !result.data?.uid || !Number.isFinite(Date.parse(result.data?.start)) || !["accepted", "pending"].includes(result.data?.status)) {
    console.error("Cal.com returned an invalid booking confirmation.");
    return jsonResponse({
      success: false,
      error: "We could not verify your booking. Please check your email before trying again."
    }, 502);
  }
  return jsonResponse({
    success: true,
    scheduledAt: result.data.start,
    timezone: value.inviteeTimezone,
    status: result.data.status
  });
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
function validateBooking(body) {
  const stringFields = [
    ["fullName", 200],
    ["email", 320],
    ["phone", 40],
    ["propertyAddress", 500],
    ["notes", 2e3],
    ["appointmentType", 80],
    ["service", 80],
    ["preferredDate", 10],
    ["preferredTime", 20],
    ["inviteeTimezone", 100]
  ];
  if (stringFields.some(
    ([field, maximumLength]) => typeof body?.[field] !== "string" || body[field].length > maximumLength
  )) {
    return {
      success: false,
      error: "Some booking information is invalid or too long."
    };
  }
  const fullName = text(body?.fullName, 200);
  const email = text(body?.email, 320).toLowerCase();
  const phone = text(body?.phone, 40);
  const propertyAddress = text(body?.propertyAddress, 500);
  const notes = text(body?.notes, 2e3);
  const appointmentType = text(body?.appointmentType, 80);
  const service = text(body?.service, 80);
  const preferredDate = text(body?.preferredDate, 10);
  const preferredTime = text(body?.preferredTime, 20);
  const inviteeTimezone = text(body?.inviteeTimezone, 100);
  if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || !appointmentTypes.has(appointmentType) || !services.has(service) || !timeWindows.has(preferredTime) || body?.privacyConsent !== true) {
    return {
      success: false,
      error: "Please complete the required booking information and privacy acknowledgement."
    };
  }
  const dateStart = validDateStart(preferredDate);
  if (dateStart === null) {
    return { success: false, error: "Please choose a valid appointment date." };
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: inviteeTimezone });
  } catch {
    return { success: false, error: "A valid time zone is required to book." };
  }
  if (getLocalTimeParts(Date.now(), inviteeTimezone).date > preferredDate) {
    return { success: false, error: "Please choose today or a future date." };
  }
  return {
    success: true,
    value: {
      fullName,
      email,
      phone,
      propertyAddress,
      notes,
      appointmentType,
      service,
      preferredDate,
      preferredTime,
      inviteeTimezone
    }
  };
}
__name(validateBooking, "validateBooking");
__name2(validateBooking, "validateBooking");
function text(value, maximumLength) {
  return typeof value === "string" && value.length <= maximumLength ? value.trim() : "";
}
__name(text, "text");
__name2(text, "text");
function validDateStart(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const dateStart = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(dateStart) && new Date(dateStart).toISOString().slice(0, 10) === value ? dateStart : null;
}
__name(validDateStart, "validDateStart");
__name2(validDateStart, "validDateStart");
function getLocalTimeParts(timestamp, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour)
  };
}
__name(getLocalTimeParts, "getLocalTimeParts");
__name2(getLocalTimeParts, "getLocalTimeParts");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
__name(jsonResponse, "jsonResponse");
__name2(jsonResponse, "jsonResponse");
var COOKIE = "site_chat_v2";
var MAX_AGE = 30 * 24 * 60 * 60;
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function reply(data, status = 200, setCookie) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  if (setCookie) headers.set("Set-Cookie", setCookie);
  return new Response(JSON.stringify(data), { status, headers });
}
__name(reply, "reply");
__name2(reply, "reply");
function settings(env) {
  const base = (env.CHATWOOT_BASE_URL || "https://app.chatwoot.com").replace(/\/+$/, "");
  const inbox = (env.CHATWOOT_SITE_API_INBOX_IDENTIFIER || "").trim();
  const secret = env.CHAT_SESSION_SECRET || "";
  if (!/^https:\/\/[^/]+$/i.test(base) || !inbox || secret.length < 32) {
    throw new Error("CHAT_CONFIGURATION_MISSING");
  }
  return { base, inbox, secret, api: `${base}/public/api/v1/inboxes/${encodeURIComponent(inbox)}` };
}
__name(settings, "settings");
__name2(settings, "settings");
function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64url, "base64url");
__name2(base64url, "base64url");
function unbase64url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("BAD_ENCODING");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
__name(unbase64url, "unbase64url");
__name2(unbase64url, "unbase64url");
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
__name(hmacKey, "hmacKey");
__name2(hmacKey, "hmacKey");
async function sessionCookie(session, cfg, request) {
  const data = base64url(encoder.encode(JSON.stringify(session)));
  const signature = new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    await hmacKey(cfg.secret),
    encoder.encode(data)
  ));
  const isHttps = new URL(request.url).protocol === "https:";
  return [
    `${COOKIE}=${data}.${base64url(signature)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/api/chat",
    `Max-Age=${MAX_AGE}`,
    ...isHttps ? ["Secure"] : []
    // For local HTTP testing on port 2886.
  ].join("; ");
}
__name(sessionCookie, "sessionCookie");
__name2(sessionCookie, "sessionCookie");
async function readSession(request, cfg) {
  try {
    const cookieValue = (request.headers.get("Cookie") || "").split(";").map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    if (!cookieValue) return null;
    const [payload, signature, extra] = cookieValue.split(".");
    if (!payload || !signature || extra) return null;
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(cfg.secret),
      unbase64url(signature),
      encoder.encode(payload)
    );
    if (!valid) return null;
    const session = JSON.parse(decoder.decode(unbase64url(payload)));
    if (session.v !== 2 || session.inbox !== cfg.inbox || typeof session.sourceId !== "string" || !session.sourceId || !Number.isSafeInteger(session.conversationId) || session.conversationId < 1 || !Number.isFinite(session.expires) || session.expires < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}
__name(readSession, "readSession");
__name2(readSession, "readSession");
async function chatwoot(cfg, stage, path, method = "GET", body) {
  let response;
  try {
    response = await fetch(`${cfg.api}${path}`, {
      method,
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      ...body === void 0 ? {} : { body: JSON.stringify(body) }
    });
  } catch {
    console.error("Chatwoot connection failed at", stage);
    throw { stage, upstreamStatus: 0 };
  }
  if (!response.ok) {
    console.error("Chatwoot request failed:", stage, "HTTP", response.status);
    throw { stage, upstreamStatus: response.status };
  }
  try {
    return await response.json();
  } catch {
    console.error("Chatwoot returned non-JSON:", stage);
    throw { stage, upstreamStatus: response.status };
  }
}
__name(chatwoot, "chatwoot");
__name2(chatwoot, "chatwoot");
function conversationPath(session) {
  return `/contacts/${encodeURIComponent(session.sourceId)}/conversations/${session.conversationId}`;
}
__name(conversationPath, "conversationPath");
__name2(conversationPath, "conversationPath");
function normalize(message) {
  return {
    id: message.id,
    content: message.content || "",
    messageType: message.message_type,
    createdAt: message.created_at
  };
}
__name(normalize, "normalize");
__name2(normalize, "normalize");
function errorResponse(error, cookie) {
  const missing = error?.message === "CHAT_CONFIGURATION_MISSING";
  return reply({
    error: missing ? "Chat configuration is incomplete." : "Chat service request failed. Check chat history before retrying.",
    stage: missing ? "configuration" : error?.stage || "unexpected",
    ...Number.isInteger(error?.upstreamStatus) ? { upstreamStatus: error.upstreamStatus } : {}
  }, missing ? 503 : 502, cookie);
}
__name(errorResponse, "errorResponse");
__name2(errorResponse, "errorResponse");
async function onRequestGet({ request, env }) {
  try {
    const cfg = settings(env);
    const session = await readSession(request, cfg);
    if (!session) return reply({ connected: false, messages: [] });
    const data = await chatwoot(cfg, "get_messages", `${conversationPath(session)}/messages`);
    const entries = Array.isArray(data) ? data : Array.isArray(data?.payload) ? data.payload : [];
    const messages = entries.filter((m) => [0, 1, "incoming", "outgoing"].includes(m.message_type) && typeof m.content === "string" && m.content.trim() && !m.private).map(normalize).sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
    return reply({ connected: true, conversationId: session.conversationId, messages });
  } catch (error) {
    console.error("GET /api/chat failed at", error?.stage || error?.message || "unexpected");
    return errorResponse(error);
  }
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function onRequestPost2({ request, env }) {
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin)
    return reply({ error: "Origin not allowed." }, 403);
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json"))
    return reply({ error: "Expected application/json." }, 415);
  let cfg;
  let session;
  try {
    cfg = settings(env);
    let body;
    try {
      body = await request.json();
    } catch {
      return reply({ error: "Invalid JSON." }, 400);
    }
    const content = typeof body?.message === "string" ? body.message.trim() : "";
    if (!content || content.length > 4e3)
      return reply({ error: "Message must be 1\u20134000 characters." }, 400);
    if (!["message", "quick_question"].includes(body?.type))
      return reply({ error: "Unsupported message type." }, 400);
    if (body.type === "quick_question" && !["quote", "services", "consultation", "agent"].includes(body.optionId))
      return reply({ error: "Unknown quick question." }, 400);
    session = await readSession(request, cfg);
    if (!session) {
      const contact = await chatwoot(
        cfg,
        "create_contact",
        "/contacts",
        "POST",
        { name: "Website Visitor" }
      );
      if (!contact?.source_id) throw { stage: "create_contact_response" };
      const path = `/contacts/${encodeURIComponent(contact.source_id)}/conversations`;
      const conversation = await chatwoot(
        cfg,
        "create_conversation",
        path,
        "POST",
        { custom_attributes: {} }
      );
      if (!Number.isSafeInteger(conversation?.id))
        throw { stage: "create_conversation_response" };
      session = {
        v: 2,
        inbox: cfg.inbox,
        sourceId: contact.source_id,
        conversationId: conversation.id,
        expires: Date.now() + MAX_AGE * 1e3
      };
    }
    const cookie = await sessionCookie(session, cfg, request);
    const message = await chatwoot(
      cfg,
      "send_message",
      `${conversationPath(session)}/messages`,
      "POST",
      { content }
    );
    if (!message?.id) throw { stage: "send_message_response" };
    return reply({
      success: true,
      conversationId: session.conversationId,
      message: normalize(message)
    }, 200, cookie);
  } catch (error) {
    console.error("POST /api/chat failed at", error?.stage || error?.message || "unexpected");
    const cookie = cfg && session ? await sessionCookie(session, cfg, request) : void 0;
    return errorResponse(error, cookie);
  }
}
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
function onRequestPost3() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
__name(onRequestPost3, "onRequestPost3");
__name2(onRequestPost3, "onRequestPost");
async function onRequestPost4(context) {
  try {
    const { request, env } = context;
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse2({ success: false, error: "Invalid JSON request." }, 400);
    }
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();
    const source = String(body.source || "").trim();
    const submittedAt = String(body.submittedAt || "").trim();
    if (!fullName || !email || !phone || !address) {
      return jsonResponse2({ success: false, error: "Full name, email, phone and address are required." }, 400);
    }
    const formId = env.GOOGLE_FORM_ID;
    const nameEntry = env.GOOGLE_FORM_NAME_ENTRY;
    const emailEntry = env.GOOGLE_FORM_EMAIL_ENTRY;
    const phoneEntry = env.GOOGLE_FORM_PHONE_ENTRY;
    const addressEntry = env.GOOGLE_FORM_ADDRESS_ENTRY;
    const sourceEntry = env.GOOGLE_FORM_SOURCE_ENTRY;
    const submittedAtEntry = env.GOOGLE_FORM_SUBMITTED_AT_ENTRY;
    if (!formId || !nameEntry || !emailEntry || !phoneEntry || !addressEntry) {
      console.error("Google Form environment variables are missing.");
      return jsonResponse2({ success: false, error: "Server configuration error." }, 500);
    }
    const formData = new URLSearchParams();
    formData.append(nameEntry, fullName);
    formData.append(emailEntry, email);
    formData.append(phoneEntry, phone);
    formData.append(addressEntry, address);
    if (sourceEntry && source) {
      formData.append(sourceEntry, source);
    }
    if (submittedAtEntry && submittedAt) {
      formData.append(submittedAtEntry, submittedAt);
    }
    const googleFormUrl = `https://docs.google.com/forms/d/e/${formId}/formResponse`;
    const googleResponse = await fetch(googleFormUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: formData.toString()
    });
    if (!googleResponse.ok && googleResponse.status !== 302) {
      console.error("Google Forms submission failed:", googleResponse.status);
      return jsonResponse2({ success: false, error: "Unable to submit information." }, 502);
    }
    return jsonResponse2({ success: true, message: "Lead submitted successfully." });
  } catch (error) {
    console.error("estimate-lead API error:", error);
    return jsonResponse2({ success: false, error: "Internal server error." }, 500);
  }
}
__name(onRequestPost4, "onRequestPost4");
__name2(onRequestPost4, "onRequestPost");
async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Allow": "POST, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      // ✅ Helpful if testing locally
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(onRequestOptions, "onRequestOptions");
__name2(onRequestOptions, "onRequestOptions");
function jsonResponse2(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
      // ✅ Allows your React app to read the success status
    }
  });
}
__name(jsonResponse2, "jsonResponse2");
__name2(jsonResponse2, "jsonResponse");
var FIELD_LIMIT = 2e3;
var formEntries = {
  fullName: "GOOGLE_FORM_NAME_ENTRY",
  email: "GOOGLE_FORM_EMAIL_ENTRY",
  phone: "GOOGLE_FORM_PHONE_ENTRY",
  zipCode: "GOOGLE_FORM_ADDRESS_ENTRY",
  service: "GOOGLE_FORM_SERVICE",
  propertyType: "GOOGLE.FORM_TYPE_ENTRY",
  ownership: "GOOGLE.FORM_OWN_ENTRY",
  roofType: "GOOGLE_FORM_RTYPE_ENTRY",
  roofSize: "GOOGLE_FORM_RSIZE_ENTRY",
  roofCondition: "GOOGLE_FORM_RCONDITION_ENTRY",
  timeline: "GOOGLE.FORM_TIMELINE_ENTRY",
  budget: "GOOGLE.FORM_BUDGET_ENTRY",
  projectDescription: "GOOGLE_FORM_NOTES_ENTRY",
  creditScore: "GOOGLE_FORM_CREDITSCORE_ENTRY",
  preferredContact: "GOOGLE_FORM_CONTACT_ENTRY"
};
async function onRequestPost5({ request, env }) {
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
    return jsonResponse3({ success: false, error: "Expected application/json." }, 415);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse3({ success: false, error: "Invalid JSON request." }, 400);
  }
  if (!body || typeof body !== "object") return jsonResponse3({ success: false, error: "Invalid lead data." }, 400);
  const values = Object.fromEntries(Object.entries(body).filter(([key, value]) => key !== "privacyConsent" && typeof value === "string").map(([key, value]) => [key, value.trim()]));
  if (Object.values(values).some((value) => value.length > FIELD_LIMIT)) return jsonResponse3({ success: false, error: "Some qualification information is too long." }, 400);
  if (!values.fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || !values.phone || !values.zipCode) return jsonResponse3({ success: false, error: "Name, email, phone and ZIP code are required." }, 400);
  if (!env.GOOGLE_FORM_ID || !env.GOOGLE_FORM_NAME_ENTRY || !env.GOOGLE_FORM_EMAIL_ENTRY || !env.GOOGLE_FORM_PHONE_ENTRY || !env.GOOGLE_FORM_ADDRESS_ENTRY) {
    console.error("Google Form environment variables are missing.");
    return jsonResponse3({ success: false, error: "Lead capture is temporarily unavailable." }, 503);
  }
  const formData = new URLSearchParams();
  const included = /* @__PURE__ */ new Set();
  for (const [field, value] of Object.entries(values)) {
    const snake = field.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase();
    const entry = env[formEntries[field]] || env[`GOOGLE_FORM_${snake}_ENTRY`] || env[`GOOGLE_FORM_${snake}`];
    if (entry && value) {
      formData.set(entry, value);
      included.add(field);
    }
  }
  formData.set(env.GOOGLE_FORM_ADDRESS_ENTRY, values.address || values.zipCode);
  if (env.GOOGLE_FORM_SOURCE_ENTRY) formData.set(env.GOOGLE_FORM_SOURCE_ENTRY, "qualification");
  if (env.GOOGLE_FORM_SUBMITTED_AT_ENTRY) formData.set(env.GOOGLE_FORM_SUBMITTED_AT_ENTRY, (/* @__PURE__ */ new Date()).toISOString());
  const remaining = Object.entries(values).filter(([field, value]) => value && !included.has(field) && field !== "fullName" && field !== "email" && field !== "phone" && field !== "zipCode");
  if (remaining.length && env.GOOGLE_FORM_NOTES_ENTRY) formData.set(env.GOOGLE_FORM_NOTES_ENTRY, remaining.map(([field, value]) => `${field}: ${value}`).join("\n"));
  try {
    const response = await fetch(`https://docs.google.com/forms/d/e/${encodeURIComponent(env.GOOGLE_FORM_ID)}/formResponse`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: formData.toString(), redirect: "manual", signal: AbortSignal.timeout(15e3) });
    if (!response.ok && response.status !== 302) return jsonResponse3({ success: false, error: "Lead capture is temporarily unavailable." }, 502);
  } catch (error) {
    console.error("Google Forms qualification lead request failed:", error.name);
    return jsonResponse3({ success: false, error: "Lead capture is temporarily unavailable." }, 502);
  }
  return jsonResponse3({ success: true });
}
__name(onRequestPost5, "onRequestPost5");
__name2(onRequestPost5, "onRequestPost");
function jsonResponse3(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
__name(jsonResponse3, "jsonResponse3");
__name2(jsonResponse3, "jsonResponse");
async function onRequestPost6({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse4({
      success: false,
      verified: false,
      error: "Invalid JSON request."
    }, 400);
  }
  const email = String(body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse4({
      success: false,
      verified: false,
      error: "Please enter a valid email address."
    }, 400);
  }
  const apiKey = env.HUNTER_API_KEY;
  if (!apiKey) {
    console.error("HUNTER_API_KEY is missing.");
    return jsonResponse4({
      success: false,
      verified: false,
      error: "Email verification is unavailable."
    }, 503);
  }
  try {
    const hunterUrl = new URL(
      "https://api.hunter.io/v2/email-verifier"
    );
    hunterUrl.searchParams.set("email", email);
    hunterUrl.searchParams.set("api_key", apiKey);
    const hunterResponse = await fetch(hunterUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });
    console.info(
      "Hunter API HTTP status:",
      hunterResponse.status
    );
    if (hunterResponse.status === 202) {
      return jsonResponse4({
        success: false,
        verified: false,
        pending: true,
        error: "Email verification is still processing. Please try again shortly."
      }, 202);
    }
    if (hunterResponse.status === 222) {
      return jsonResponse4({
        success: false,
        verified: false,
        error: "The email provider could not be verified. Please try again later."
      }, 502);
    }
    if (!hunterResponse.ok) {
      console.error(
        "Hunter API request failed:",
        hunterResponse.status
      );
      return jsonResponse4({
        success: false,
        verified: false,
        error: "We could not verify your email. Please try again."
      }, 502);
    }
    const result = await hunterResponse.json();
    const data = result?.data;
    const status = data?.status;
    console.info("Hunter verification result:", {
      status,
      smtpCheck: data?.smtp_check,
      disposable: data?.disposable,
      acceptAll: data?.accept_all,
      blocked: data?.block
    });
    const isVerified = (status === "valid" || status === "webmail" && data?.smtp_check === true) && data?.disposable !== true && data?.accept_all !== true && data?.block !== true;
    if (!isVerified) {
      return jsonResponse4({
        success: false,
        verified: false,
        status: status || "unknown",
        error: "We could not confirm that this email address is deliverable. Please use another address."
      }, 422);
    }
    return jsonResponse4({
      success: true,
      verified: true,
      status,
      message: "Email verified successfully."
    }, 200);
  } catch (error) {
    console.error(
      "Hunter verification request failed:",
      error
    );
    return jsonResponse4({
      success: false,
      verified: false,
      error: "Unable to complete email verification. Please try again."
    }, 502);
  }
}
__name(onRequestPost6, "onRequestPost6");
__name2(onRequestPost6, "onRequestPost");
function jsonResponse4(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
__name(jsonResponse4, "jsonResponse4");
__name2(jsonResponse4, "jsonResponse");
var routes = [
  {
    routePath: "/api/booking",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/chatwoot-callback",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/estimate-lead",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/estimate-lead",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/qualification-lead",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/verify-email",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function getOriginalPathPrefix(requestPath, normalizedPrefix) {
  let end = 0;
  for (let index = 0; index < normalizedPrefix.length; index++) {
    end++;
    if (normalizedPrefix[index] === "/") {
      while (requestPath[end] === "/") {
        end++;
      }
    }
  }
  return requestPath.slice(0, end);
}
__name(getOriginalPathPrefix, "getOriginalPathPrefix");
__name2(getOriginalPathPrefix, "getOriginalPathPrefix");
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  const normalizedRequestPath = requestPath.replace(/\/+/g, "/");
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath) || routeMatcher(normalizedRequestPath);
    const originalMountMatch = mountMatcher(requestPath);
    const mountMatchResult = originalMountMatch || mountMatcher(normalizedRequestPath);
    if (matchResult && mountMatchResult) {
      const path = originalMountMatch ? originalMountMatch.path : getOriginalPathPrefix(requestPath, mountMatchResult.path);
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-gEvjXw/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-gEvjXw/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.44631438763109654.js.map
