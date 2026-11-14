/** Developer API token helpers (Workers runtime). */

export function generateApiToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `mra_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export async function hashApiToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function bearerToken(request) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
