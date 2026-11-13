/**
 * Netlify Function: GraphQL passthrough to AniList.
 *
 * Same contract as the Vercel function in api/anilist.js:
 *   POST /api/anilist  { query, variables }
 *
 * Health probe (open in a browser after deploying):
 *   GET /api/anilist?check=1
 *   -> { ok: true, status: 200, latencyMs: 123 }
 */
const ENDPOINT = 'https://graphql.anilist.co';
const TIMEOUT_MS = 9000;
const ANILIST_HEADERS = {
  'content-type': 'application/json',
  accept: 'application/json',
  'user-agent': 'MrAnime/1.0 (+https://mranime.cyou)',
};

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

async function healthCheck() {
  const started = Date.now();
  let upstream;
  try {
    upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: ANILIST_HEADERS,
      body: JSON.stringify({ query: '{ Page(perPage: 1) { media(type: ANIME) { id } } }' }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return json(504, { ok: false, error: 'AniList request failed.', code: 'TIMEOUT', latencyMs: Date.now() - started });
  }

  const payload = await upstream.json().catch(() => null);
  const ok = upstream.ok && Array.isArray(payload?.data?.Page?.media) && payload.data.Page.media.length > 0;
  return json(ok ? 200 : 502, {
    ok,
    status: upstream.status,
    latencyMs: Date.now() - started,
    ...(ok ? {} : { code: 'UPSTREAM_ERROR' }),
  });
}

export default async function handler(req) {
  const url = new URL(req.url);

  if (req.method === 'GET' && url.searchParams.get('check') === '1') {
    return healthCheck();
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed', code: 'BAD_REQUEST' }, { allow: 'POST' });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
  }
  if (!payload || typeof payload.query !== 'string') {
    return json(400, { error: 'Missing GraphQL "query".', code: 'BAD_REQUEST' });
  }

  let upstream;
  try {
    upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: ANILIST_HEADERS,
      body: JSON.stringify({ query: payload.query, variables: payload.variables ?? {} }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return json(504, { error: 'AniList request failed.', code: 'TIMEOUT' });
  }

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/json',
      'cache-control': 'public, max-age=60',
    },
  });
}

export const config = { path: '/api/anilist' };
