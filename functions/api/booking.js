const DAY_IN_MS = 24 * 60 * 60 * 1000;

const appointmentTypes = new Set([
  "Initial consultation",
  "Site visit",
  "Project follow-up",
]);

const services = new Set([
  "Roofing",
  "Solar",
  "Impact windows",
  "Multiple services",
]);

const timeWindows = new Set(["Morning", "Afternoon", "Flexible"]);

export async function onRequestPost({ request, env }) {
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

  const apiToken = env.CALENDLY_API_TOKEN;
  const eventTypeUri = env.CALENDLY_EVENT_TYPE_URI;
  if (!apiToken || !isCalendlyEventTypeUri(eventTypeUri)) {
    console.error("Calendly booking configuration is missing or invalid.");
    return jsonResponse({
      success: false,
      error: "Online booking is temporarily unavailable. Please try again later.",
    }, 503);
  }

  const { value } = booking;
  const dateStart = Date.parse(`${value.preferredDate}T00:00:00Z`);
  const rangeStart = Math.max(Date.now() + 1000, dateStart - DAY_IN_MS);
  const rangeEnd = dateStart + 2 * DAY_IN_MS;

  const availabilityUrl = new URL(
    "https://api.calendly.com/event_type_available_times"
  );
  availabilityUrl.searchParams.set("event_type", eventTypeUri);
  availabilityUrl.searchParams.set(
    "start_time",
    new Date(rangeStart).toISOString()
  );
  availabilityUrl.searchParams.set(
    "end_time",
    new Date(rangeEnd).toISOString()
  );

  let availabilityResponse;
  try {
    availabilityResponse = await fetch(availabilityUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
    });
  } catch (error) {
    console.error("Calendly availability request failed:", error);
    return jsonResponse({
      success: false,
      error: "We could not check appointment availability. Please try again.",
    }, 502);
  }

  if (!availabilityResponse.ok) {
    console.error(
      "Calendly availability request failed with HTTP status:",
      availabilityResponse.status
    );
    return jsonResponse({
      success: false,
      error: "We could not check appointment availability. Please try again.",
    }, 502);
  }

  let availability;
  try {
    availability = await availabilityResponse.json();
  } catch (error) {
    console.error("Calendly returned invalid availability data:", error);
    return jsonResponse({
      success: false,
      error: "We could not check appointment availability. Please try again.",
    }, 502);
  }

  if (!Array.isArray(availability?.collection)) {
    console.error("Calendly availability response did not include a collection.");
    return jsonResponse({
      success: false,
      error: "We could not check appointment availability. Please try again.",
    }, 502);
  }

  const matchingSlot = availability.collection
    .filter((slot) => {
      const start = Date.parse(slot?.start_time);
      if (!Number.isFinite(start)) {
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
    })
    .sort((first, second) =>
      Date.parse(first.start_time) - Date.parse(second.start_time)
    )[0];

  if (!matchingSlot) {
    return jsonResponse({
      success: false,
      error: "No appointment times are available for that date and time window. Please choose another.",
    }, 409);
  }

  const bookingPayload = {
    event_type: eventTypeUri,
    start_time: matchingSlot.start_time,
    invitee: {
      name: value.fullName,
      email: value.email,
      timezone: value.inviteeTimezone,
    },
    questions_and_answers: [
      { question: "Appointment type", answer: value.appointmentType, position: 0 },
      { question: "Service", answer: value.service, position: 1 },
      { question: "Telephone number", answer: value.phone, position: 2 },
      { question: "Property address", answer: value.propertyAddress || "Not provided", position: 3 },
      { question: "Additional information", answer: value.notes || "None", position: 4 },
    ],
  };

  let bookingResponse;
  try {
    bookingResponse = await fetch("https://api.calendly.com/invitees", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingPayload),
    });
  } catch (error) {
    console.error("Calendly booking request failed:", error);
    return jsonResponse({
      success: false,
      error: "Calendly could not confirm the appointment. Please try again.",
    }, 502);
  }

  if (bookingResponse.status !== 201) {
    console.error(
      "Calendly booking request failed with HTTP status:",
      bookingResponse.status
    );
    return jsonResponse({
      success: false,
      error: "Calendly could not confirm the appointment. Please try again.",
    }, 502);
  }

  return jsonResponse({
    success: true,
    scheduledAt: matchingSlot.start_time,
    timezone: value.inviteeTimezone,
  });
}

function validateBooking(body) {
  const stringFields = [
    ["fullName", 200],
    ["email", 320],
    ["phone", 40],
    ["propertyAddress", 500],
    ["notes", 2000],
    ["appointmentType", 80],
    ["service", 80],
    ["preferredDate", 10],
    ["preferredTime", 20],
    ["inviteeTimezone", 100],
  ];

  if (stringFields.some(([field, maximumLength]) =>
    typeof body?.[field] !== "string" || body[field].length > maximumLength
  )) {
    return {
      success: false,
      error: "Some booking information is invalid or too long.",
    };
  }

  const fullName = text(body?.fullName, 200);
  const email = text(body?.email, 320).toLowerCase();
  const phone = text(body?.phone, 40);
  const propertyAddress = text(body?.propertyAddress, 500);
  const notes = text(body?.notes, 2000);
  const appointmentType = text(body?.appointmentType, 80);
  const service = text(body?.service, 80);
  const preferredDate = text(body?.preferredDate, 10);
  const preferredTime = text(body?.preferredTime, 20);
  const inviteeTimezone = text(body?.inviteeTimezone, 100);

  if (
    !fullName ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !phone ||
    !appointmentTypes.has(appointmentType) ||
    !services.has(service) ||
    !timeWindows.has(preferredTime) ||
    body?.privacyConsent !== true
  ) {
    return {
      success: false,
      error: "Please complete the required booking information and privacy acknowledgement.",
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
      inviteeTimezone,
    },
  };
}

function text(value, maximumLength) {
  return typeof value === "string" && value.length <= maximumLength
    ? value.trim()
    : "";
}

function validDateStart(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const dateStart = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(dateStart) &&
    new Date(dateStart).toISOString().slice(0, 10) === value
    ? dateStart
    : null;
}

function getLocalTimeParts(timestamp, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
  };
}

function isCalendlyEventTypeUri(value) {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "api.calendly.com" &&
      /^\/event_types\/[^/]+$/.test(url.pathname);
  } catch {
    return false;
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
