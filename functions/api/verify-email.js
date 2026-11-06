
export async function onRequestPost({ request, env }) {
  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({
      success: false,
      verified: false,
      error: "Invalid JSON request.",
    }, 400);
  }

  const email = String(body?.email || "")
    .trim()
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({
      success: false,
      verified: false,
      error: "Please enter a valid email address.",
    }, 400);
  }

  const apiKey = env.HUNTER_API_KEY;

  if (!apiKey) {
    console.error("HUNTER_API_KEY is missing.");

    return jsonResponse({
      success: false,
      verified: false,
      error: "Email verification is unavailable.",
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
        Accept: "application/json",
      },
    });

    console.info(
      "Hunter API HTTP status:",
      hunterResponse.status
    );

    // Hunter sometimes returns 202 while processing.
    if (hunterResponse.status === 202) {
      return jsonResponse({
        success: false,
        verified: false,
        pending: true,
        error:
          "Email verification is still processing. Please try again shortly.",
      }, 202);
    }

    // Hunter uses 222 for certain SMTP failures.
    if (hunterResponse.status === 222) {
      return jsonResponse({
        success: false,
        verified: false,
        error:
          "The email provider could not be verified. Please try again later.",
      }, 502);
    }

    if (!hunterResponse.ok) {
      console.error(
        "Hunter API request failed:",
        hunterResponse.status
      );

      return jsonResponse({
        success: false,
        verified: false,
        error:
          "We could not verify your email. Please try again.",
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
      blocked: data?.block,
    });

    // Accept validated addresses.
    // Webmail is allowed only when SMTP validation succeeds.
    const isVerified =
      (
        status === "valid" ||
        (
          status === "webmail" &&
          data?.smtp_check === true
        )
      ) &&
      data?.disposable !== true &&
      data?.accept_all !== true &&
      data?.block !== true;

    if (!isVerified) {
      return jsonResponse({
        success: false,
        verified: false,
        status: status || "unknown",
        error:
          "We could not confirm that this email address is deliverable. Please use another address.",
      }, 422);
    }

    // Only a confirmed verification reaches this point.
    return jsonResponse({
      success: true,
      verified: true,
      status,
      message: "Email verified successfully.",
    }, 200);

  } catch (error) {
    console.error(
      "Hunter verification request failed:",
      error
    );

    return jsonResponse({
      success: false,
      verified: false,
      error:
        "Unable to complete email verification. Please try again.",
    }, 502);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
