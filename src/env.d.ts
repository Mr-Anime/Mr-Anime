export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: Fetcher;
  TMDB_READ_ACCESS_TOKEN?: string;
  EMAIL_API_KEY?: string;
  SESSION_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  SITE_URL?: string;
  OAUTH_ISSUER?: string;
  REQUIRE_LOGIN_TO_WATCH?: string;
  PROVIDER_1_BASE?: string;
  PROVIDER_2_BASE?: string;
  PROVIDER_3_BASE?: string;
}

declare namespace App {
  interface Locals {
    user: any | null;
    runtime?: { env: Env };
  }
}
