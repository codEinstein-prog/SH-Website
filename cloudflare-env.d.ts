declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    CALCOM_API_KEY?: string;
    CALCOM_EVENT_TYPE_ID?: string;
    GOOGLE_FORM_ID?: string;
    GOOGLE_FORM_NAME_ENTRY?: string;
    GOOGLE_FORM_EMAIL_ENTRY?: string;
    GOOGLE_FORM_PHONE_ENTRY?: string;
    GOOGLE_FORM_ADDRESS_ENTRY?: string;
    GOOGLE_FORM_SOURCE_ENTRY?: string;
    GOOGLE_FORM_SUBMITTED_AT_ENTRY?: string;
    GOOGLE_FORM_NOTES_ENTRY?: string;
    GOOGLE_FORM_ZIP_CODE_ENTRY?: string;
    "GOOGLE.FORM_TYPE_ENTRY"?: string;
    "GOOGLE.FORM_OWN_ENTRY"?: string;
    "GOOGLE.FORM_RTYPE_ENTRY"?: string;
    "GOOGLE.FORM_RSIZE_ENTRY"?: string;
    "GOOGLE.FORM_RCONDITION_ENTRY"?: string;
    "GOOGLE.FORM_TIMELINE_ENTRY"?: string;
    "GOOGLE.FORM_BUDGET_ENTRY"?: string;
    "GOOGLE.FORM_CREDITSCORE_ENTRY"?: string;
    "GOOGLE.FORM_CONTACT_ENTRY"?: string;
  }
}
