const FIELD_LIMIT = 2000;

const formEntries = {
  fullName: "GOOGLE_FORM_NAME_ENTRY",
  email: "GOOGLE_FORM_EMAIL_ENTRY",
  phone: "GOOGLE_FORM_PHONE_ENTRY",
  zipCode: "GOOGLE_FORM_ADDRESS_ENTRY",
  service: "GOOGLE_FORM_SERVICE",
  propertyType: "GOOGLE.FORM_TYPE_ENTRY",
  ownership: "GOOGLE.FORM_OWN_ENTRY",
  roofType: "GOOGLE.FORM_RTYPE_ENTRY",
  roofSize: "GOOGLE.FORM_RSIZE_ENTRY",
  roofCondition: "GOOGLE.FORM_RCONDITION_ENTRY",
  timeline: "GOOGLE.FORM_TIMELINE_ENTRY",
  budget: "GOOGLE.FORM_BUDGET_ENTRY",
  projectDescription: "GOOGLE_FORM_NOTES_ENTRY",
  creditScore: "GOOGLE.FORM_CREDITSCORE_ENTRY",
  preferredContact: "GOOGLE.FORM_CONTACT_ENTRY",
};

export async function onRequestPost({ request, env }) {
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
    return jsonResponse({ success: false, error: "Expected application/json." }, 415);
  }

  let body;
  try { body = await request.json(); } catch { return jsonResponse({ success: false, error: "Invalid JSON request." }, 400); }
  if (!body || typeof body !== "object") return jsonResponse({ success: false, error: "Invalid lead data." }, 400);

  const values = Object.fromEntries(Object.entries(body).filter(([key, value]) => key !== "privacyConsent" && typeof value === "string").map(([key, value]) => [key, value.trim()]));
  if (Object.values(values).some((value) => value.length > FIELD_LIMIT)) return jsonResponse({ success: false, error: "Some qualification information is too long." }, 400);
  if (!values.fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || !values.phone || !values.zipCode) return jsonResponse({ success: false, error: "Name, email, phone and ZIP code are required." }, 400);

  if (!env.GOOGLE_FORM_ID || !env.GOOGLE_FORM_NAME_ENTRY || !env.GOOGLE_FORM_EMAIL_ENTRY || !env.GOOGLE_FORM_PHONE_ENTRY || !env.GOOGLE_FORM_ADDRESS_ENTRY) {
    console.error("Google Form environment variables are missing.");
    return jsonResponse({ success: false, error: "Lead capture is temporarily unavailable." }, 503);
  }

  const formData = new URLSearchParams();
  const included = new Set();
  for (const [field, value] of Object.entries(values)) {
    const snake = field.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase();
    const entry = env[formEntries[field]] || env[`GOOGLE_FORM_${snake}_ENTRY`] || env[`GOOGLE_FORM_${snake}`];
    if (entry && value) { formData.set(entry, value); included.add(field); }
  }
  formData.set(env.GOOGLE_FORM_ADDRESS_ENTRY, values.address || values.zipCode);
  if (env.GOOGLE_FORM_SOURCE_ENTRY) formData.set(env.GOOGLE_FORM_SOURCE_ENTRY, "qualification");
  if (env.GOOGLE_FORM_SUBMITTED_AT_ENTRY) formData.set(env.GOOGLE_FORM_SUBMITTED_AT_ENTRY, new Date().toISOString());

  const remaining = Object.entries(values).filter(([field, value]) => value && !included.has(field) && field !== "fullName" && field !== "email" && field !== "phone" && field !== "zipCode");
  if (remaining.length && env.GOOGLE_FORM_NOTES_ENTRY) formData.set(env.GOOGLE_FORM_NOTES_ENTRY, remaining.map(([field, value]) => `${field}: ${value}`).join("\n"));

  try {
    const response = await fetch(`https://docs.google.com/forms/d/e/${encodeURIComponent(env.GOOGLE_FORM_ID)}/formResponse`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: formData.toString(), redirect: "manual", signal: AbortSignal.timeout(15000) });
    if (!response.ok && response.status !== 302) return jsonResponse({ success: false, error: "Lead capture is temporarily unavailable." }, 502);
  } catch (error) { console.error("Google Forms qualification lead request failed:", error.name); return jsonResponse({ success: false, error: "Lead capture is temporarily unavailable." }, 502); }
  return jsonResponse({ success: true });
}

function jsonResponse(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
