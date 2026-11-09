/**
 * Thin client for the Pages Functions API (/api/*).
 *
 * In dev, VITE_API_BASE is empty and Vite proxies /api to `wrangler pages dev`.
 * The Worker serves AniList-backed endpoints (Module 3).
 *
 * While the Workers are not yet built you can render the UI against mock data:
 *   VITE_USE_MOCK_API=true   in .env
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

async function request(path, { signal, timeout = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeout);
  const onAbort = () => controller.abort(signal.reason);
  signal?.addEventListener('abort', onAbort);

  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!res.ok) {
      let body = null;
      try {
        body = await res.json();
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(body?.error || `Request failed (${res.status})`, { status: res.status, code: body?.code });
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

async function get(path, opts) {
  if (USE_MOCK_API) {
    // @TODO remove once Workers are live and verified in production.
    try {
      const { mockResponse } = await import('./mock.js');
      return await mockResponse(path);
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
  trending: (opts) => get('/api/trending', opts),
  homeRows: (opts) => get('/api/trending?rows=1', opts),
  anime: (id, opts) => get(`/api/anime/${encodeURIComponent(id)}`, opts),
  search: (params, opts) => get(`/api/search${qs(params)}`, opts),
  suggestions: (q, opts) => get(`/api/search${qs({ q, perPage: 6, suggestions: 1 })}`, opts),
  schedule: (params, opts) => get(`/api/schedule${qs(params)}`, opts),
  availability: (id, opts) => get(`/api/availability/${encodeURIComponent(id)}`, opts),
  adminStats: (opts) => get('/api/admin/stats', opts),
};
