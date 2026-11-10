/**
 * Thin client for the Pages Functions API (/api/*).
 *
 * In dev, VITE_API_BASE is empty and Vite proxies /api to `wrangler pages dev`.
 * Set VITE_USE_MOCK_API=true to render against src/api/mock.js instead.
 */

const BASE = import.meta.env.VITE_API_BASE || '';
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

let tokenGetter = null;
/** Register a function returning the current Supabase access token (or null). */
export function setAccessToken(getter) {
  tokenGetter = getter;
}

async function authHeaders() {
  if (!tokenGetter) return {};
  try {
    const token = await tokenGetter();
    return token ? { authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request(path, { signal, timeout = 15000, method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeout);
  const onAbort = () => controller.abort(signal.reason);
  signal?.addEventListener('abort', onAbort);

  try {
    const headers = { accept: 'application/json', ...(await authHeaders()) };
    if (body !== undefined) headers['content-type'] = 'application/json';
    const res = await fetch(`${BASE}${path}`, {
      method,
      signal: controller.signal,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      let payload = null;
      try {
        payload = await res.json();
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(payload?.error || `Request failed (${res.status})`, { status: res.status, code: payload?.code });
    }
    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (controller.signal.reason === 'timeout') throw new ApiError('The request timed out.', { code: 'TIMEOUT' });
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Network error. Check your connection and try again.', { code: 'NETWORK' });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

async function call(path, opts) {
  if (USE_MOCK_API) {
    try {
      const { mockResponse } = await import('./mock.js');
      return await mockResponse(path, opts);
    } catch (err) {
      throw err instanceof ApiError ? err : new ApiError(err.message || 'Mock request failed', { status: err.status });
    }
  }
  return request(path, opts);
}

function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    sp.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  trending: (opts) => call('/api/trending', opts),
  homeRows: (opts) => call('/api/trending?rows=1', opts),
  anime: (id, opts) => call(`/api/anime/${encodeURIComponent(id)}`, opts),
  animeBatch: (ids, opts) => call(`/api/anime/batch${qs({ ids })}`, opts),
  search: (params, opts) => call(`/api/search${qs(params)}`, opts),
  suggestions: (q, opts) => call(`/api/search${qs({ q, perPage: 6, suggestions: 1 })}`, opts),
  schedule: (params, opts) => call(`/api/schedule${qs(params)}`, opts),
  availability: (id, opts) => call(`/api/availability/${encodeURIComponent(id)}`, opts),
  adminStats: (opts) => call('/api/admin/stats', opts),
  adminOverrides: (opts) => call('/api/admin/availability', opts),
  saveAdminOverride: (override, opts) => call('/api/admin/availability', { ...opts, method: 'POST', body: override }),
  deleteAdminOverride: (anilistId, opts) => call(`/api/admin/availability?anilistId=${encodeURIComponent(anilistId)}`, { ...opts, method: 'DELETE' }),
};
