declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    CALCOM_API_KEY?: string;
    CALCOM_EVENT_TYPE_ID?: string;
  }
}
