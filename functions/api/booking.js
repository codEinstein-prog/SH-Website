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

  const apiKey = env.CALCOM_API_KEY?.trim();
  const eventTypeId = Number(env.CALCOM_EVENT_TYPE_ID);
  if (!apiKey || !Number.isSafeInteger(eventTypeId) || eventTypeId <= 0) {
    console.error("Cal.com booking configuration is missing or invalid.");
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
        "cal-api-version": "2024-09-04",
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("Cal.com availability request failed:", error.name);
    return jsonResponse({
      success: false,
      error: "We could not check appointment availability. Please try again.",
    }, 502);
  }

  if (!availabilityResponse.ok) {
    console.error(
      "Cal.com availability request failed with HTTP status:",
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
    console.error("Cal.com returned invalid availability data:", error.name);
    return jsonResponse({
      success: false,
      error: "We could not check appointment availability. Please try again.",
    }, 502);
  }

  if (
    availability?.status !== "success" ||
    !availability.data ||
    typeof availability.data !== "object" ||
    Array.isArray(availability.data) ||
    !Object.values(availability.data).every(Array.isArray)
  ) {
    console.error("Cal.com availability response did not include valid slots.");
    return jsonResponse({
      success: false,
      error: "We could not check appointment availability. Please try again.",
    }, 502);
  }

  const matchingSlot = Object.values(availability.data).flat()
    .filter((slot) => {
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
    })
    .sort((first, second) =>
      Date.parse(first.start) - Date.parse(second.start)
    )[0];

  if (!matchingSlot) {
    return jsonResponse({
      success: false,
      error: "No appointment times are available for that date and time window. Please choose another.",
    }, 409);
  }

  const bookingPayload = {
    eventTypeId,
    start: new Date(matchingSlot.start).toISOString(),
    attendee: {
      name: value.fullName,
      email: value.email,
      timeZone: value.inviteeTimezone,
      language: "en",
    },
    bookingFieldsResponses: {
      notes: [
        `Appointment type: ${value.appointmentType}`,
        `Service: ${value.service}`,
        `Telephone number: ${value.phone}`,
        `Property address: ${value.propertyAddress || "Not provided"}`,
        `Additional information: ${value.notes || "None"}`,
      ].join("\n"),
    },
    metadata: {
      source: "website",
      appointmentType: value.appointmentType,
      service: value.service,
      phone: value.phone,
      propertyAddress: value.propertyAddress,
    },
  };

  // Cal.com requires international format for SMS reminders. Preserve all
  // phone formats in the notes, without guessing the visitor's country code.
  const internationalPhone = value.phone.replace(/[\s().-]/g, "");
  if (/^\+[1-9]\d{6,14}$/.test(internationalPhone)) {
    bookingPayload.attendee.phoneNumber = internationalPhone;
  }

  let bookingResponse;
  try {
    bookingResponse = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": "2026-02-25",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingPayload),
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    console.error("Cal.com booking request failed:", error.name);
    return jsonResponse({
      success: false,
      error: "We could not verify your booking. Please check your email before trying again.",
    }, 502);
  }

  if (bookingResponse.status === 409) {
    return jsonResponse({
      success: false,
      error: "That appointment time is no longer available. Please choose another date or time window.",
    }, 409);
  }

  if (!bookingResponse.ok) {
    console.error(
      "Cal.com booking request failed with HTTP status:",
      bookingResponse.status
    );
    return jsonResponse({
      success: false,
      error: "We could not confirm the appointment. Please check your email before trying again or contact us for help.",
    }, 502);
  }

  let result;
  try {
    result = await bookingResponse.json();
  } catch {
    // The booking may have been created even if its response was interrupted.
  }

  if (
    result?.status !== "success" ||
    !result.data?.uid ||
    !Number.isFinite(Date.parse(result.data?.start)) ||
    !["accepted", "pending"].includes(result.data?.status)
  ) {
    console.error("Cal.com returned an invalid booking confirmation.");
    return jsonResponse({
      success: false,
      error: "We could not verify your booking. Please check your email before trying again.",
    }, 502);
  }

  return jsonResponse({
    success: true,
    scheduledAt: result.data.start,
    timezone: value.inviteeTimezone,
    status: result.data.status,
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

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
