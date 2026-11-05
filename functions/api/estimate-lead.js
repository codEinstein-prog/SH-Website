export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON request." }, 400);
    }

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();
    const source = String(body.source || "").trim();
    const submittedAt = String(body.submittedAt || "").trim();

    // Required payload fields
    if (!fullName || !email || !phone || !address) {
      return jsonResponse({ success: false, error: "Full name, email, phone and address are required." }, 400);
    }

    // Google Form configuration from environment variables
    const formId = env.GOOGLE_FORM_ID;
    const nameEntry = env.GOOGLE_FORM_NAME_ENTRY;
    const emailEntry = env.GOOGLE_FORM_EMAIL_ENTRY;
    const phoneEntry = env.GOOGLE_FORM_PHONE_ENTRY;
    const addressEntry = env.GOOGLE_FORM_ADDRESS_ENTRY;
    const sourceEntry = env.GOOGLE_FORM_SOURCE_ENTRY;
    const submittedAtEntry = env.GOOGLE_FORM_SUBMITTED_AT_ENTRY; // ✅ Added missing definition

    // Make sure the required environment variables exist (Fixed trailing comma)
    if (!formId || !nameEntry || !emailEntry || !phoneEntry || !addressEntry) {
      console.error("Google Form environment variables are missing.");
      return jsonResponse({ success: false, error: "Server configuration error." }, 500);
    }

    // Build Google Forms submission payload
    const formData = new URLSearchParams();
    formData.append(nameEntry, fullName);
    formData.append(emailEntry, email);
    formData.append(phoneEntry, phone);
    formData.append(addressEntry, address);

    // Optional fields
    if (sourceEntry && source) {
      formData.append(sourceEntry, source);
    }
    if (submittedAtEntry && submittedAt) { // ✅ Will no longer crash
      formData.append(submittedAtEntry, submittedAt);
    }

    const googleFormUrl = `https://docs.google.com/forms/d/e/${formId}/formResponse`;

    const googleResponse = await fetch(googleFormUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: formData.toString(),
    });

    // Google Forms commonly responds with a 200 HTML page or 302 redirect
    if (!googleResponse.ok && googleResponse.status !== 302) {
      console.error("Google Forms submission failed:", googleResponse.status);
      return jsonResponse({ success: false, error: "Unable to submit information." }, 502);
    }

    return jsonResponse({ success: true, message: "Lead submitted successfully." });
  } catch (error) {
    console.error("estimate-lead API error:", error);
    return jsonResponse({ success: false, error: "Internal server error." }, 500);
  }
}

/* Handle browser preflight requests */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Allow": "POST, OPTIONS",
      "Access-Control-Allow-Origin": "*", // ✅ Helpful if testing locally
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/* JSON response helper */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // ✅ Allows your React app to read the success status
    },
  });
}
