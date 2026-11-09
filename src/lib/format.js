const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const STATUS_LABELS = {
  FINISHED: 'Finished',
  RELEASING: 'Airing',
  NOT_YET_RELEASED: 'Not Yet Aired',
  CANCELLED: 'Cancelled',
  HIATUS: 'Hiatus',
};

export const FORMAT_LABELS = {
  TV: 'TV',
  TV_SHORT: 'TV Short',
  MOVIE: 'Movie',
  SPECIAL: 'Special',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Music',
};

export const SEASON_LABELS = { WINTER: 'Winter', SPRING: 'Spring', SUMMER: 'Summer', FALL: 'Fall' };

export const LIST_STATUSES = [
  { value: 'watching', label: 'Watching' },
  { value: 'planning', label: 'Planning' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
];

const num = new Intl.NumberFormat('en-US');

export function formatCount(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return num.format(n);
}

export function formatScore(score) {
  return score == null ? '—' : (score / 10).toFixed(1);
}

export function formatDuration(mins) {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m ? `${m}m` : ''}`.trim() : `${m}m`;
}

export function formatFuzzyDate({ year, month, day } = {}) {
  if (!year) return 'Unknown';
  if (!month) return String(year);
  if (!day) return `${MONTHS[month - 1]} ${year}`;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

/** "Spring 2025" / "2025" / "TBA" */
export function formatSeasonYear(season, year) {
  if (season && year) return `${SEASON_LABELS[season]} ${year}`;
  return year ? String(year) : 'TBA';
}

export function formatTimeAgo(unixSeconds) {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return 'just now';
  const units = [
    [31536000, 'y'],
    [2592000, 'mo'],
    [604800, 'w'],
    [86400, 'd'],
    [3600, 'h'],
    [60, 'm'],
  ];
  for (const [secs, label] of units) {
    if (diff >= secs) return `${Math.floor(diff / secs)}${label} ago`;
  }
  return 'just now';
}

/** Human countdown: "2d 04h" / "03:12:45" */
export function formatCountdown(ms) {
  if (ms <= 0) return 'Airing now';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Duration in seconds → "12:34" or "1:02:34" */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return h ? `${h}:${mm}:${String(sec).padStart(2, '0')}` : `${mm}:${String(sec).padStart(2, '0')}`;
}

/** Episode count per spec: AniList episodes, else nextAiringEpisode.episode - 1. */
export function getEpisodeCount(media) {
  if (!media) return 0;
  if (media.episodes) return media.episodes;
  if (media.nextAiringEpisode?.episode) return Math.max(0, media.nextAiringEpisode.episode - 1);
  return 0;
}

export function mediaTitle(media) {
  return media?.title?.english || media?.title?.romaji || media?.title?.native || 'Untitled';
}
