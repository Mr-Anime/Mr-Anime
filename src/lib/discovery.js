/** Browse categories (used by Home "View all" links and the Browse page). */
export const CATEGORIES = [
  { id: 'trending', label: 'Trending', params: { sort: 'TRENDING_DESC' } },
  { id: 'popular', label: 'Popular', params: { sort: 'POPULARITY_DESC' } },
  { id: 'top-rated', label: 'Top Rated', params: { sort: 'SCORE_DESC' } },
  { id: 'recent', label: 'Recently Updated', params: { sort: 'UPDATED_AT_DESC', status: 'RELEASING' } },
  { id: 'upcoming', label: 'Upcoming', params: { sort: 'POPULARITY_DESC', status: 'NOT_YET_RELEASED' } },
];

export const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha',
  'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports',
  'Supernatural', 'Thriller',
];

export const FORMATS = [
  { value: 'TV', label: 'TV' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'SPECIAL', label: 'Special' },
];

export const SEASONS = [
  { value: 'WINTER', label: 'Winter' },
  { value: 'SPRING', label: 'Spring' },
  { value: 'SUMMER', label: 'Summer' },
  { value: 'FALL', label: 'Fall' },
];

export const STATUS_OPTIONS = [
  { value: 'RELEASING', label: 'Airing' },
  { value: 'FINISHED', label: 'Finished' },
  { value: 'NOT_YET_RELEASED', label: 'Not yet aired' },
];

export const SORT_OPTIONS = [
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'POPULARITY_DESC', label: 'Most popular' },
  { value: 'SCORE_DESC', label: 'Highest rated' },
  { value: 'FAVOURITES_DESC', label: 'Most favourited' },
  { value: 'START_DATE_DESC', label: 'Newest' },
  { value: 'UPDATED_AT_DESC', label: 'Recently updated' },
];

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}

/** Current year range for the year picker (newest first). */
export function yearOptions(count = 26) {
  const now = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => now + 1 - i);
}

/** Read filter state from a URLSearchParams-like object into API params. */
export function filtersToParams(sp) {
  const params = {};
  for (const key of ['q', 'genre', 'format', 'season', 'year', 'status', 'sort', 'page']) {
    const v = sp.get(key);
    if (v) params[key] = v;
  }
  params.perPage = 24;
  return params;
}
