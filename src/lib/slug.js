import { mediaTitle } from './format.js';

/** URL-safe slug. Falls back to "anime" for titles with no latin characters. */
export function slugify(value, max = 60) {
  return (
    String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, max)
      .replace(/-+$/g, '') || 'anime'
  );
}

export function mediaSlug(media) {
  return slugify(mediaTitle(media));
}

/** /info/{anilist_id}/{anime-slug} */
export function infoPath(media) {
  return `/info/${media.id}/${mediaSlug(media)}`;
}

/** Player slugs end with the AniList id so /player/{slug}/{episode} can resolve without a search. */
export function playerSlug(media) {
  return `${mediaSlug(media)}-${media.id}`;
}

/** /player/{anime-slug}/{episode}?lang={sub|dub} */
export function playerPath(media, episode, lang = 'sub') {
  return `/player/${playerSlug(media)}/${episode}?lang=${lang}`;
}

export function anilistIdFromPlayerSlug(slug) {
  const match = String(slug || '').match(/-(\d{1,10})$/);
  return match ? Number(match[1]) : null;
}

/** "attack-on-titan-16498" -> "attack on titan" for a title search fallback. */
export function searchTitleFromSlug(slug) {
  return String(slug || '')
    .replace(/-\d{1,10}$/, '')
    .replace(/-+/g, ' ')
    .trim();
}
