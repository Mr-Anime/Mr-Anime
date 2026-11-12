import { handle, positiveInt } from '../lib/http.js';
import { anilistQuery, PAGE_QUERY } from '../lib/anilist.js';
import { toCard, toMedia, toPageInfo, toSuggestion } from '../lib/map.js';
import {
  GENRES,
  SUGGESTION_SORT,
  clampSearchTerm,
  formatFromParam,
  genresFromParam,
  seasonFromParam,
  sortFromParam,
  statusFromParam,
  yearFromParam,
} from '../lib/query.js';
import { cachedJson } from '../lib/cache.js';

const SEARCH_TTL = 300;

export const onRequest = handle(async ({ request, env }) => {
  const sp = new URL(request.url).searchParams;
  const page = positiveInt(sp.get('page'), 1, { max: 500 });
  const suggestions = sp.get('suggestions') === '1';
  const perPage = suggestions ? positiveInt(sp.get('perPage'), 8, { max: 10 }) : positiveInt(sp.get('perPage'), 24, { max: 50 });

  const q = clampSearchTerm(sp.get('q'));
  const genre = genresFromParam(sp.get('genre'));
  const format = formatFromParam(sp.get('format'));
  const season = seasonFromParam(sp.get('season'));
  const status = statusFromParam(sp.get('status'));
  const year = yearFromParam(sp.get('year') || sp.get('seasonYear'));
  const sort = suggestions ? [SUGGESTION_SORT] : [sortFromParam(sp.get('sort'))];

  const variables = {
    page,
    perPage,
    sort,
    search: q,
    genre_in: genre.length ? genre : undefined,
    format_in: format ? [format] : undefined,
    season: season || undefined,
    seasonYear: year || undefined,
    status: status || undefined,
  };

  const cacheKey = `search:v1:${suggestions ? 'sug' : 'page'}:${JSON.stringify(variables)}`;
  const payload = await cachedJson(env, cacheKey, suggestions ? SEARCH_TTL * 12 : SEARCH_TTL, async () => {
    const data = await anilistQuery(PAGE_QUERY, variables, { env });
    const pageData = data?.Page || {};
    if (suggestions) return { data: (pageData.media || []).map(toSuggestion) };
    return { pageInfo: toPageInfo(pageData), media: (pageData.media || []).map(toMedia) };
  });

  return payload;
}, { methods: ['GET'] });
