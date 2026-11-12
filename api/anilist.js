/**
 * Vercel Function: GraphQL passthrough to AniList.
 *
 * AniList manually blocks Cloudflare Workers' egress IPs, so Cloudflare Pages
 * Functions cannot call graphql.anilist.co directly. Deploy this repo to
 * Vercel and set ANILIST_ENDPOINT=https://<project>.vercel.app/api/anilist on
 * the Pages project.
 */
const ENDPOINT = 'https://graphql.anilist.co';
const TIMEOUT_MS = 9000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed', code: 'BAD_REQUEST' });
  }

  // Vercel parses JSON bodies; fall back to raw in case of string/stream.
  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
    }
  }
  if (!payload || typeof payload.query !== 'string') {
    return res.status(400).json({ error: 'Missing GraphQL "query".', code: 'BAD_REQUEST' });
  }

  let upstream;
  try {
    upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': 'MrAnime/1.0 (+https://mranime.cyou)',
      },
      body: JSON.stringify({ query: payload.query, variables: payload.variables ?? {} }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return res.status(504).json({ error: 'AniList request failed.', code: 'TIMEOUT' });
  }

  const body = await upstream.text();
  res.setHeader('content-type', upstream.headers.get('content-type') || 'application/json');
  return res.status(upstream.status).send(body);
}
