import assert from "node:assert/strict";
import { test } from "node:test";
import { onRequestPost } from "../functions/api/booking.js";

const env = { CALCOM_API_KEY: "cal_test_secret", CALCOM_EVENT_TYPE_ID: "123" };
const form = {
  appointmentType: "Site visit",
  service: "Solar",
  fullName: "Test Visitor",
  email: "visitor@example.com",
  phone: "+1 (786) 555-0123",
  propertyAddress: "123 Test Street",
  preferredDate: "2030-06-10",
  preferredTime: "Morning",
  notes: "Please check the roof.",
  privacyConsent: true,
  inviteeTimezone: "America/New_York",
};

function context(t, responses) {
  t.mock.method(Date, "now", () => Date.parse("2030-06-09T12:00:00Z"));
  t.mock.method(console, "error", () => {});
  return t.mock.method(globalThis, "fetch", async () => {
    assert.ok(responses.length, "Unexpected upstream request");
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return next;
  });
}

function slots(starts = ["2030-06-10T09:00:00-04:00"]) {
  return Response.json({
    status: "success",
    data: { "2030-06-10": starts.map((start) => ({ start })) },
  });
}

function booked(status = "accepted", start = "2030-06-10T13:00:00Z") {
  return Response.json({ status: "success", data: { uid: "test-booking", start, status } }, { status: 201 });
}

function submit(overrides = {}, settings = env, requestOptions = {}) {
  return onRequestPost({
    env: settings,
    request: new Request("https://example.com/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://example.com" },
      body: JSON.stringify({ ...form, ...overrides }),
      ...requestOptions,
    }),
  });
}

test("uses Cal.com versions, selects earliest local slot, and sends project details", async (t) => {
  const fetch = context(t, [slots([
    "2030-06-10T14:00:00-04:00",
    "2030-06-10T11:00:00-04:00",
    "2030-06-10T09:00:00-04:00",
    "2030-06-10T02:00:00Z", // Previous date in New York.
    "invalid",
  ]), booked()]);
  const response = await submit({ notes: "a".repeat(2000) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    scheduledAt: "2030-06-10T13:00:00Z",
    timezone: "America/New_York",
    status: "accepted",
  });
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url.origin + url.pathname, "https://api.cal.com/v2/slots");
  assert.equal(url.searchParams.get("eventTypeId"), "123");
  assert.equal(url.searchParams.get("timeZone"), form.inviteeTimezone);
  assert.equal(url.searchParams.get("format"), "range");
  assert.equal(options.headers["cal-api-version"], "2024-09-04");
  assert.equal(options.headers.Authorization, "Bearer cal_test_secret");
  const [bookingUrl, bookingOptions] = fetch.mock.calls[1].arguments;
  assert.equal(bookingUrl, "https://api.cal.com/v2/bookings");
  assert.equal(bookingOptions.headers["cal-api-version"], "2026-02-25");
  assert.equal(bookingOptions.headers.Authorization, "Bearer cal_test_secret");
  const payload = JSON.parse(bookingOptions.body);
  assert.equal(payload.eventTypeId, 123);
  assert.equal(payload.start, "2030-06-10T13:00:00.000Z");
  assert.equal(payload.attendee.timeZone, form.inviteeTimezone);
  assert.equal(payload.attendee.phoneNumber, "+17865550123");
  assert.equal(payload.metadata.propertyAddress, form.propertyAddress);
  assert.match(payload.bookingFieldsResponses.notes, /Site visit/);
  assert.ok(payload.bookingFieldsResponses.notes.includes("a".repeat(2000)));
  assert.ok(Object.values(payload.metadata).every((value) => value.length <= 500));
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("afternoon starts at 1 PM and preserves pending host approval", async (t) => {
  const fetch = context(t, [slots(["2030-06-10T12:59:00-04:00", "2030-06-10T13:00:00-04:00"]),
    booked("pending", "2030-06-10T17:00:00Z")]);
  const response = await submit({ preferredTime: "Afternoon", phone: "786 555 0123" });
  assert.equal((await response.json()).status, "pending");
  const payload = JSON.parse(fetch.mock.calls[1].arguments[1].body);
  assert.equal(payload.start, "2030-06-10T17:00:00.000Z");
  assert.equal(payload.attendee.phoneNumber, undefined);
  assert.match(payload.bookingFieldsResponses.notes, /786 555 0123/);
});

test("flexible booking respects the local date across the international date line", async (t) => {
  const fetch = context(t, [slots(["2030-06-09T18:00:00Z", "2030-06-10T18:00:00Z"]),
    booked("accepted", "2030-06-09T18:00:00Z")]);
  const response = await submit({ preferredTime: "Flexible", inviteeTimezone: "Pacific/Kiritimati" });
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(fetch.mock.calls[1].arguments[1].body).start, "2030-06-09T18:00:00.000Z");
});

test("no matching availability never creates a booking", async (t) => {
  const fetch = context(t, [slots(["2030-06-10T14:00:00-04:00"])]);
  assert.equal((await submit()).status, 409);
  assert.equal(fetch.mock.callCount(), 1);
});

test("empty availability and past slots never create a booking", async (t) => {
  const fetch = context(t, [Response.json({ status: "success", data: {} }), slots(["2030-06-09T09:00:00Z"])]);
  assert.equal((await submit()).status, 409);
  assert.equal((await submit({ preferredDate: "2030-06-09", inviteeTimezone: "UTC" })).status, 409);
  assert.equal(fetch.mock.callCount(), 2);
});

test("invalid configuration fails before contacting Cal.com", async (t) => {
  const fetch = context(t, []);
  for (const settings of [{}, { ...env, CALCOM_API_KEY: " " }, { ...env, CALCOM_EVENT_TYPE_ID: "0" },
    { ...env, CALCOM_EVENT_TYPE_ID: "invalid" }, { ...env, CALCOM_EVENT_TYPE_ID: "1.5" }]) {
    assert.equal((await submit({}, settings)).status, 503);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("invalid form values and cross-origin requests never reach Cal.com", async (t) => {
  const fetch = context(t, []);
  for (const invalid of [{ privacyConsent: false }, { email: "invalid" }, { inviteeTimezone: "bad/zone" },
    { preferredDate: "2030-02-30" }, { preferredDate: "2020-01-01" }, { service: "invalid" }, { notes: "a".repeat(2001) }]) {
    assert.equal((await submit(invalid)).status, 400);
  }
  assert.equal((await submit({}, env, { headers: { Origin: "https://other.com", "Content-Type": "application/json" } })).status, 403);
  assert.equal((await submit({}, env, { headers: { "Content-Type": "text/plain" } })).status, 415);
  assert.equal((await submit({}, env, { body: "{" })).status, 400);
  assert.equal(fetch.mock.callCount(), 0);
});

test("upstream availability errors and malformed data fail without booking", async (t) => {
  const fetch = context(t, [
    new Error("network failure"),
    new Response("Unauthorized", { status: 401 }),
    new Response("not json"),
    Response.json({ status: "error", data: {} }),
    Response.json({ status: "success", data: { date: null } }),
  ]);
  for (let i = 0; i < 5; i++) assert.equal((await submit()).status, 502);
  assert.equal(fetch.mock.callCount(), 5);
});

test("a slot taken during submission reports a conflict", async (t) => {
  context(t, [slots(), new Response("Conflict", { status: 409 })]);
  const response = await submit();
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /no longer available/);
});

test("uncertain booking outcomes never show success or retry automatically", async (t) => {
  const fetch = context(t, [
    slots(), new Error("timeout"),
    slots(), new Response("error", { status: 500 }),
    slots(), new Response("not json", { status: 201 }),
    slots(), Response.json({ status: "success", data: {} }),
    slots(), booked("cancelled"),
  ]);
  for (let i = 0; i < 5; i++) {
    const response = await submit();
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.error, /check your email/i);
  }
  assert.equal(fetch.mock.callCount(), 10);
});
