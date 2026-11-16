/** Shared helpers for the developer OAuth 2.0 (authorization code + PKCE) API. */

import { ApiError, json } from './http.js';
import { hashApiToken } from './tokens.js';

export const ACCESS_TOKEN_TTL_SECONDS = 24 * 60 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;
export const CODE_TTL_SECONDS = 10 * 60;
export const ALLOWED_SCOPES = ['read'];

const MAX_BODY_BYTES = 8 * 1024;

export const OAUTH_CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};

export function randomToken(prefix, bytes = 32) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return `${prefix}${Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export function sha256Hex(value) {
  return hashApiToken(value);
}

function base64url(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function pkceChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

export function oauthJson(data, { status = 200, headers = {} } = {}) {
  return json(data, {
    status,
    headers: {
      ...OAUTH_CORS,
      'cache-control': 'no-store',
      pragma: 'no-cache',
      vary: 'origin',
      ...headers,
    },
  });
}

export function oauthError(error, description, status = 400, headers = {}) {
  return oauthJson({ error, error_description: description }, { status, headers });
}

/**
 * Like `handle()` from http.js, but with the OAuth error envelope and CORS.
 * OPTIONS is answered here because `handle()` would reject it before the body.
 */
export function oauthHandler(handler, { methods = ['POST'] } = {}) {
  return async function wrapped(context) {
    const { request } = context;
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: OAUTH_CORS });
    }
    if (!methods.includes(request.method)) {
      return oauthError('invalid_request', `Method ${request.method} not allowed.`, 405, {
        allow: methods.join(', '),
      });
    }
    try {
      return await handler(context);
    } catch (err) {
      if (err instanceof ApiError) {
        return oauthError(err.code.toLowerCase(), err.message, err.status, err.headers);
      }
      console.error(`[oauth] ${request.method} ${request.url} failed:`, err);
      return oauthError('server_error', 'Unexpected server error.', 500);
    }
  };
}

/** Parse a JSON or form-encoded request body (small bodies only). */
export async function readBody(request) {
  const buf = await request.arrayBuffer();
  if (buf.byteLength > MAX_BODY_BYTES) {
    throw new ApiError('Request body too large.', { status: 413, code: 'INVALID_REQUEST' });
  }
  const text = new TextDecoder().decode(buf);
  const type = (request.headers.get('content-type') || '').toLowerCase();
  if (!text) return {};
  if (type.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError('Invalid JSON body.', { status: 400, code: 'INVALID_REQUEST' });
    }
  }
  return Object.fromEntries(new URLSearchParams(text).entries());
}

/** Client credentials from HTTP Basic auth and/or the request body. */
export function clientAuth(request, body = {}) {
  let clientId = typeof body.client_id === 'string' ? body.client_id : '';
  let clientSecret = typeof body.client_secret === 'string' ? body.client_secret : '';

  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Basic\s+(.+)$/i);
  if (match) {
    try {
      const decoded = atob(match[1].trim());
      const sep = decoded.indexOf(':');
      if (sep !== -1) {
        clientId = decodeURIComponent(decoded.slice(0, sep));
        clientSecret = decodeURIComponent(decoded.slice(sep + 1));
      }
    } catch {
      /* malformed Basic header falls through to body credentials */
    }
  }
  return { clientId, clientSecret };
}

export function parseScope(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'read';
  const parts = raw.split(/\s+/);
  if (parts.length !== 1 || !ALLOWED_SCOPES.includes(parts[0])) return null;
  return parts[0];
}

export function hasScope(scope, name) {
  return String(scope || '')
    .split(/\s+/)
    .includes(name);
}

export function validPkceChallenge(challenge) {
  return typeof challenge === 'string' && /^[A-Za-z0-9_-]{43,128}$/.test(challenge);
}

export function validPkceVerifier(verifier) {
  return typeof verifier === 'string' && /^[A-Za-z0-9\-._~]{43,128}$/.test(verifier);
}

/** HTTPS anywhere; plain HTTP only for loopback development redirects. */
export function isAllowedRedirectUri(uri) {
  if (typeof uri !== 'string' || !uri || uri.length > 300) return false;
  let url;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.hash) return false;
  if (url.protocol === 'https:') return true;
  if (url.protocol !== 'http:') return false;
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}
