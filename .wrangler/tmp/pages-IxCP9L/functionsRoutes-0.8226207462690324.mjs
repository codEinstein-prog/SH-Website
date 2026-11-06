import { onRequestPost as __api_booking_js_onRequestPost } from "C:\\Users\\SS01\\Documents\\Nick\\WebDev\\SH Website\\functions\\api\\booking.js"
import { onRequestGet as __api_chat_js_onRequestGet } from "C:\\Users\\SS01\\Documents\\Nick\\WebDev\\SH Website\\functions\\api\\chat.js"
import { onRequestPost as __api_chat_js_onRequestPost } from "C:\\Users\\SS01\\Documents\\Nick\\WebDev\\SH Website\\functions\\api\\chat.js"
import { onRequestPost as __api_chatwoot_callback_js_onRequestPost } from "C:\\Users\\SS01\\Documents\\Nick\\WebDev\\SH Website\\functions\\api\\chatwoot-callback.js"
import { onRequestOptions as __api_estimate_lead_js_onRequestOptions } from "C:\\Users\\SS01\\Documents\\Nick\\WebDev\\SH Website\\functions\\api\\estimate-lead.js"
import { onRequestPost as __api_estimate_lead_js_onRequestPost } from "C:\\Users\\SS01\\Documents\\Nick\\WebDev\\SH Website\\functions\\api\\estimate-lead.js"
import { onRequestPost as __api_qualification_lead_js_onRequestPost } from "C:\\Users\\SS01\\Documents\\Nick\\WebDev\\SH Website\\functions\\api\\qualification-lead.js"
import { onRequestPost as __api_verify_email_js_onRequestPost } from "C:\\Users\\SS01\\Documents\\Nick\\WebDev\\SH Website\\functions\\api\\verify-email.js"

export const routes = [
    {
      routePath: "/api/booking",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_booking_js_onRequestPost],
    },
  {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_chat_js_onRequestGet],
    },
  {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_chat_js_onRequestPost],
    },
  {
      routePath: "/api/chatwoot-callback",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_chatwoot_callback_js_onRequestPost],
    },
  {
      routePath: "/api/estimate-lead",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_estimate_lead_js_onRequestOptions],
    },
  {
      routePath: "/api/estimate-lead",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_estimate_lead_js_onRequestPost],
    },
  {
      routePath: "/api/qualification-lead",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_qualification_lead_js_onRequestPost],
    },
  {
      routePath: "/api/verify-email",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_verify_email_js_onRequestPost],
    },
  ]