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
