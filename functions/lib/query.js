const KNOWN_GENRES = new Set([
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror', 'Mahou Shoujo',
  'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports',
  'Supernatural', 'Thriller',
]);

const KNOWN_FORMATS = new Set(['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']);
const KNOWN_SEASONS = new Set(['WINTER', 'SPRING', 'SUMMER', 'FALL']);
const KNOWN_STATUSES = new Set(['FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS']);
const KNOWN_SORTS = new Set([
  'TRENDING_DESC', 'POPULARITY_DESC', 'SCORE_DESC', 'FAVOURITES_DESC', 'START_DATE_DESC',
  'UPDATED_AT_DESC', 'TITLE_ROMAJI', 'TITLE_ENGLISH',
]);

export const SUGGESTION_SORT = 'SEARCH_MATCH';

export function genresFromParam(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((g) => g.trim())
    .filter((g) => KNOWN_GENRES.has(g));
}

export function formatFromParam(value) {
  const upper = String(value || '').toUpperCase().replace(/-/g, '_');
  return KNOWN_FORMATS.has(upper) ? upper : null;
}

export function seasonFromParam(value) {
  const upper = String(value || '').toUpperCase();
  return KNOWN_SEASONS.has(upper) ? upper : null;
}

export function statusFromParam(value) {
  const upper = String(value || '').toUpperCase();
  return KNOWN_STATUSES.has(upper) ? upper : null;
}

export function sortFromParam(value) {
  const upper = String(value || '').toUpperCase();
  return KNOWN_SORTS.has(upper) ? upper : 'POPULARITY_DESC';
}

/** Accepts any 4-digit year inside a sane range. */
export function yearFromParam(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1940 || n > 2100) return null;
  return n;
}

export function clampSearchTerm(value) {
  const q = String(value || '').trim();
  return q.length >= 2 ? q.slice(0, 100) : null;
}

export const GENRES = [...KNOWN_GENRES];
