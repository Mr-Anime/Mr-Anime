import { PROVIDERS } from '../../../../src/config/providers.js';
import { ApiError, badRequest, handle, json } from '../../../lib/http.js';
import { serviceClient } from '../../../lib/supabase.js';
import { bearerToken, hashApiToken } from '../../../lib/tokens.js';

const DEFAULT_AVAILABILITY = { hasSub: true, hasDub: true, subEpisodes: null, dubEpisodes: null, override: false };

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, OPTIONS',
};

async function availabilityFor(env, anilistId) {
  try {
    const client = serviceClient(env);
    const { data, error } = await client
      .from('availability_overrides')
      .select('has_sub, has_dub, sub_episodes, dub_episodes')
      .eq('anilist_id', anilistId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { ...DEFAULT_AVAILABILITY };
    return {
      hasSub: Boolean(data.has_sub),
      hasDub: Boolean(data.has_dub),
      subEpisodes: data.sub_episodes ?? null,
      dubEpisodes: data.dub_episodes ?? null,
      override: true,
    };
  } catch (err) {
    console.warn('[player] availability lookup failed, using defaults:', err.message);
    return { ...DEFAULT_AVAILABILITY };
  }
}

function fromOurSite(request, env, url) {
  if (request.headers.get('sec-fetch-site') === 'same-origin') return true;
  const ownOrigin = url.origin;
  const appUrl = (env.APP_URL || ownOrigin).replace(/\/$/, '');
  const origin = request.headers.get('origin');
  if (origin && (origin === ownOrigin || origin === appUrl)) return true;
  const referer = request.headers.get('referer') || '';
  return referer.startsWith(`${ownOrigin}/`) || referer.startsWith(`${appUrl}/`);
}

/** Require a developer API token, except for the site's own browser requests. */
async function authorize(request, env, url) {
  if (fromOurSite(request, env, url)) return;

  const token = bearerToken(request);
  if (!token) {
    throw new ApiError('API token required. Create one at /developer.', { status: 401, code: 'UNAUTHORIZED' });
  }

  const admin = serviceClient(env);
  const hash = await hashApiToken(token);
  const { data, error } = await admin
    .from('api_tokens')
    .select('id')
    .eq('token_hash', hash)
    .is('revoked_at', null)
    .maybeSingle();
  if (error) throw new ApiError('Could not verify API token.', { status: 502, code: 'UPSTREAM_ERROR' });
  if (!data) throw new ApiError('Invalid API token. Create one at /developer.', { status: 401, code: 'UNAUTHORIZED' });

  admin.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id).then(
    () => {},
    () => {},
  );
}

function buildUrl(provider, anilistId, episode, lang) {
  return provider.urlTemplate
    .replaceAll('{anilistId}', String(anilistId))
    .replaceAll('{episode}', String(episode))
    .replaceAll('{lang}', lang);
}

/**
 * GET /api/player/:anilistId/:episode?lang=sub|dub
 *
 * Returns the streaming servers (name + embed URL) for one episode. We never
 * host video: these are third-party embeds, proxied through our API so the
 * server list lives server-side and can be filtered by availability rules.
 *
 * Auth: same-origin browser requests are allowed; external callers must send
 * `Authorization: Bearer <token>` with a token from /developer.
 */
export const onRequest = handle(async ({ request, params, env }) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const rawId = String(params.anilistId || '');
  if (!/^\d{1,10}$/.test(rawId)) throw badRequest('AniList id must be a number.');
  const rawEpisode = String(params.episode || '');
  if (!/^\d{1,5}$/.test(rawEpisode)) throw badRequest('Episode must be a number.');

  const anilistId = Number(rawId);
  const episode = Number(rawEpisode);
  if (episode < 1) throw badRequest('Episode must be at least 1.');

  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') === 'dub' ? 'dub' : 'sub';

  await authorize(request, env, url);

  const availability = await availabilityFor(env, anilistId);
  const allowed = lang === 'dub' ? availability.hasDub : availability.hasSub;
  const cap = lang === 'dub' ? availability.dubEpisodes : availability.subEpisodes;
  const episodeAllowed = allowed && (cap == null || episode <= cap);

  const servers = episodeAllowed
    ? PROVIDERS.filter((p) => p.supports.includes(lang))
        .map((p) => ({ id: p.id, name: p.name, url: buildUrl(p, anilistId, episode, lang) }))
        .filter((s) => s.url)
    : [];

  return json(
    {
      data: {
        anilistId,
        episode,
        lang,
        episodeAllowed,
        servers,
        availability,
      },
    },
    { headers: CORS, cacheControl: 'public, max-age=300' },
  );
}, { methods: ['GET', 'OPTIONS'] });
