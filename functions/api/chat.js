export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request." }, 400);
  }

  const message = String(body?.message || "").trim();
  const type = body?.type;
  const optionId = body?.optionId ? String(body.optionId).trim() : "";
  const conversationId = body?.conversationId
    ? String(body.conversationId).trim()
    : "";

  if (!message || message.length > 4000) {
    return jsonResponse(
      { error: "Message must contain between 1 and 4000 characters." },
      400
    );
  }

  if (type !== "message" && type !== "quick_question") {
    return jsonResponse({ error: "Unsupported message type." }, 400);
  }

  if (type === "quick_question" && !optionId) {
    return jsonResponse({ error: "Quick question option is required." }, 400);
  }

  const adapterUrl = env.CHATWOOT_ADAPTER_API_URL;
  if (!adapterUrl) {
    console.error("Chatwoot adapter API URL is missing.");
    return jsonResponse(
      { error: "Live chat is not configured yet. Please try again later." },
      503
    );
  }

  let parsedAdapterUrl;
  try {
    parsedAdapterUrl = new URL(adapterUrl);
  } catch {
    console.error("Chatwoot adapter API URL is invalid.");
    return jsonResponse({ error: "Live chat is not configured correctly." }, 500);
  }

  if (parsedAdapterUrl.protocol !== "https:") {
    console.error("Chatwoot adapter API URL must use HTTPS.");
    return jsonResponse({ error: "Live chat is not configured correctly." }, 500);
  }

  const headers = { "Content-Type": "application/json" };
  if (env.CHATWOOT_ADAPTER_API_TOKEN) {
    headers.Authorization = `Bearer ${env.CHATWOOT_ADAPTER_API_TOKEN}`;
  }

  try {
    // Update this payload and response mapping to match the adapter's API contract.
    const adapterResponse = await fetch(parsedAdapterUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type,
        message,
        optionId: optionId || undefined,
        conversationId: conversationId || undefined,
      }),
    });

    if (!adapterResponse.ok) {
      console.error("Chatwoot adapter request failed:", adapterResponse.status);
      return jsonResponse(
        { error: "Your message could not be sent. Please try again." },
        502
      );
    }

    let result;
    try {
      result = await adapterResponse.json();
    } catch {
      console.error("Chatwoot adapter returned an invalid JSON response.");
      return jsonResponse(
        { error: "The chat service returned an invalid response." },
        502
      );
    }

    const reply = typeof result?.reply === "string" ? result.reply.trim() : "";
    const nextConversationId =
      typeof result?.conversationId === "string"
        ? result.conversationId
        : conversationId;

    if (!reply) {
      console.error("Chatwoot adapter response did not include a reply.");
      return jsonResponse(
        { error: "The chat service returned an invalid response." },
        502
      );
    }

    return jsonResponse({
      reply,
      conversationId: nextConversationId || undefined,
    });
  } catch (error) {
    console.error("Chatwoot adapter request error:", error);
    return jsonResponse(
      { error: "Your message could not be sent. Please try again." },
      502
    );
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
