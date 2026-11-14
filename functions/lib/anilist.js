import { ApiError } from './http.js';

const DEFAULT_ENDPOINT = 'https://graphql.anilist.co';
const TIMEOUT_MS = 9000;

// AniList manually blocks Cloudflare Workers' egress IPs, so in production
// ANILIST_ENDPOINT points at a non-Cloudflare proxy (see api/anilist.js).
function endpointFor(env) {
  return env?.ANILIST_ENDPOINT || DEFAULT_ENDPOINT;
}

/** Fields every card/grid item needs. */
export const CARD_FRAGMENT = `
fragment Card on Media {
  id
  title { english romaji native userPreferred }
  coverImage { extraLarge large color }
  bannerImage
  format
  seasonYear
  status
  episodes
  nextAiringEpisode { episode airingAt timeUntilAiring }
  averageScore
  genres
  description
}`;

export const MEDIA_DETAIL_QUERY = `
query MediaDetail($id: Int) {
  Media(id: $id, type: ANIME) {
    ...Card
    meanScore
    popularity
    favourites
    duration
    season
    source
    startDate { year month day }
    endDate { year month day }
    studios(isMain: true) { nodes { name } }
    trailer { id site thumbnail }
    tags { name rank }
    characters(sort: [ROLE, RELEVANCE], perPage: 12) {
      edges {
        role
        node { id name { full } image { medium } }
        voiceActors(language: JAPANESE) { id name { full } language }
      }
    }
    relations {
      edges {
        relationType
        node {
          id
          type
          title { romaji }
          coverImage { large }
          format
          episodes
          status
        }
      }
    }
    recommendations(sort: RATING_DESC, perPage: 12) {
      nodes { mediaRecommendation { ...Card } }
    }
    externalLinks { id site url type }
  }
}
${CARD_FRAGMENT}`;

export const PAGE_QUERY = `query Page($page: Int, $perPage: Int, $sort: [MediaSort], $search: String, $genre_in: [String], $format_in: [MediaFormat], $season: MediaSeason, $seasonYear: Int, $status: MediaStatus) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total currentPage lastPage hasNextPage perPage }
    media(type: ANIME, sort: $sort, search: $search, genre_in: $genre_in, format_in: $format_in, season: $season, seasonYear: $seasonYear, status: $status) { ...Card }
  }
}
${CARD_FRAGMENT}`;

export const HOME_ROWS_QUERY = `query HomeRows($season: MediaSeason, $seasonYear: Int) {
  trending: Page(page: 1, perPage: 14) { media(sort: TRENDING_DESC, type: ANIME) { ...Card } }
  popularSeason: Page(page: 1, perPage: 14) { media(sort: POPULARITY_DESC, type: ANIME, season: $season, seasonYear: $seasonYear) { ...Card } }
  topRated: Page(page: 1, perPage: 14) { media(sort: SCORE_DESC, type: ANIME, format_in: [TV, MOVIE]) { ...Card } }
  recentlyUpdated: Page(page: 1, perPage: 14) { media(sort: UPDATED_AT_DESC, type: ANIME, status: RELEASING) { ...Card } }
  upcoming: Page(page: 1, perPage: 14) { media(sort: POPULARITY_DESC, type: ANIME, status: NOT_YET_RELEASED) { ...Card } }
}
${CARD_FRAGMENT}`;

export const BATCH_QUERY = `query Batch($ids: [Int]) {
  Page(page: 1, perPage: 50) {
    media(id_in: $ids, type: ANIME) { ...Card }
  }
}
${CARD_FRAGMENT}`;

export const SCHEDULE_QUERY = `query Schedule($from: Int, $to: Int) {
  Page(page: 1, perPage: 50) {
    airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
      id
      airingAt
      episode
      media {
        id
        title { english romaji native userPreferred }
        coverImage { extraLarge large }
        format
        episodes
        nextAiringEpisode { episode airingAt timeUntilAiring }
      }
    }
  }
}`;

export const SITEMAP_QUERY = `query Sitemap {
  Page(page: 1, perPage: 500) {
    media(sort: POPULARITY_DESC, type: ANIME, format_in: [TV, MOVIE]) {
      id
      title { english romaji native userPreferred }
      bannerImage
    }
  }
}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * POST a GraphQL query to AniList with a timeout and one retry on
 * rate-limits / transient 5xx. Throws ApiError with a stable code.
 */
export async function anilistQuery(query, variables = {}, { retries = 1, env } = {}) {
  const endpoint = endpointFor(env);
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          // AniList asks API consumers to identify themselves.
          'user-agent': 'MrAnime/1.0 (+https://mranime.cyou)',
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        throw new ApiError('AniList request timed out.', { status: 504, code: 'TIMEOUT' });
      }
      throw new ApiError('Could not reach AniList.', { status: 502, code: 'UPSTREAM_ERROR' });
    }

    if (res.ok) {
      const body = await res.json().catch(() => null);
      if (!body) throw new ApiError('Invalid response from AniList.', { status: 502, code: 'UPSTREAM_ERROR' });
      if (Array.isArray(body.errors) && body.errors.length) {
        const msg = body.errors[0]?.message || 'AniList rejected the query.';
        throw new ApiError(msg, { status: 502, code: 'UPSTREAM_ERROR' });
      }
      return body.data;
    }

    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < retries) {
      const retryAfter = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 5) * 1000 : 1500);
      continue;
    }
    if (res.status === 429) {
      throw new ApiError('AniList rate limit reached. Try again in a moment.', {
        status: 429,
        code: 'RATE_LIMITED',
        headers: { 'retry-after': res.headers.get('retry-after') || '30' },
      });
    }
    if (res.status === 403) {
      throw new ApiError('AniList is blocking requests from this server. Set ANILIST_ENDPOINT to a non-Cloudflare proxy.', {
        status: 502,
        code: 'UPSTREAM_BLOCKED',
      });
    }
    if (res.status === 404) throw new ApiError('Not found on AniList.', { status: 404, code: 'NOT_FOUND' });
    throw new ApiError(`AniList responded with ${res.status}.`, { status: 502, code: 'UPSTREAM_ERROR' });
  }
}

/** Current anime season, used for "popular this season". */
export function currentSeason(now = new Date()) {
  const m = now.getUTCMonth() + 1;
  const season = m <= 3 ? 'WINTER' : m <= 6 ? 'SPRING' : m <= 9 ? 'SUMMER' : 'FALL';
  return { season, seasonYear: now.getUTCFullYear() };
}
