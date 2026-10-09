/**
 * Only allow local absolute paths for post-login redirects (blocks open redirects).
 */
export function sanitizeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v.startsWith("/")) return null;
  if (v.startsWith("//") || v.startsWith("/\\")) return null;
  if (v.includes("..")) return null;
  return v;
}

/**
 * OAuth redirect URI rules: https only (http allowed for localhost during
 * development), no fragments, bounded length.
 */
export function isAllowedRedirectUri(uri: string): boolean {
  if (uri.length > 500) return false;
  try {
    const url = new URL(uri);
    if (url.hash) return false;
    if (url.protocol === "https:") return true;
    if (url.protocol === "http:") {
      return url.hostname === "localhost" || url.hostname === "127.0.0.1";
    }
    return false;
  } catch {
    return false;
  }
}
