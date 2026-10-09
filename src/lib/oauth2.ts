import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** OAuth 2.0 primitives: client/secret, authorization code and access token
 * issuance (only SHA-256 hashes are ever stored). */

export const CLIENT_ID_PREFIX = "ma_cl_";
export const CLIENT_SECRET_PREFIX = "ma_cs_";
export const ACCESS_TOKEN_PREFIX = "ma_at_";
export const AUTH_CODE_PREFIX = "ma_ac_";

export const CODE_TTL_MS = 5 * 60_000;
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

export const OAUTH_SCOPES = ["read", "profile"] as const;
export type OAuthScope = (typeof OAUTH_SCOPES)[number];

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function randomSecret(prefix: string): { value: string; hash: string } {
  const value = prefix + randomBytes(32).toString("base64url");
  return { value, hash: sha256(value) };
}

export function generateClientId() {
  return randomSecret(CLIENT_ID_PREFIX);
}
export function generateClientSecret() {
  return randomSecret(CLIENT_SECRET_PREFIX);
}
export function generateAccessToken() {
  return randomSecret(ACCESS_TOKEN_PREFIX);
}
export function generateAuthCode() {
  return randomSecret(AUTH_CODE_PREFIX);
}

/** Constant-time comparison of a submitted secret against the stored hash. */
export function verifyClientSecret(secret: string, storedHash: string): boolean {
  const a = Buffer.from(sha256(secret), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Parse a space-delimited scope string. Returns null when it contains an
 * unknown scope; an absent value yields [].
 */
export function parseScopes(raw: string | null | undefined): string[] | null {
  const parts = (raw ?? "").split(/[\s+]+/).filter(Boolean);
  const unique = [...new Set(parts)];
  for (const scope of unique) {
    if (!(OAUTH_SCOPES as readonly string[]).includes(scope)) return null;
  }
  return unique;
}
