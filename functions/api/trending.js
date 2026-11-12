import { handle } from '../lib/http.js';
import { anilistQuery, currentSeason, HOME_ROWS_QUERY, PAGE_QUERY } from '../lib/anilist.js';
import { toCard } from '../lib/map.js';
import { cachedJson } from '../lib/cache.js';

const DEFAULT_TTL = 1800;

export const onRequest = handle(async ({ request, env }) => {
  const url = new URL(request.url);
  const wantRows = url.searchParams.get('rows');
  const ttl = Number(env.TRENDING_TTL_SECONDS) || DEFAULT_TTL;

  if (wantRows) {
    const { season, seasonYear } = currentSeason();
    const key = `trending:rows:v1:${season}-${seasonYear}`;
    const rows = await cachedJson(env, key, ttl, async () => {
      const data = await anilistQuery(HOME_ROWS_QUERY, { season, seasonYear }, { env });
      const out = {};
      for (const [name, page] of Object.entries(data)) {
        out[name] = { data: (page?.media || []).map(toCard).filter(Boolean) };
      }
      return { rows: out };
    });
    return rows;
  }

  const payload = await cachedJson(env, 'trending:top:v1', ttl, async () => {
    const data = await anilistQuery(PAGE_QUERY, { page: 1, perPage: 10, sort: ['TRENDING_DESC'] }, { env });
    return { data: (data?.Page?.media || []).map(toCard).filter(Boolean) };
  });
  return payload;
}, { methods: ['GET'] });
