/**
 * Mr.Anime — embed provider configuration.
 *
 * THIS IS THE ONLY PLACE URL PATTERNS MAY BE DEFINED.
 * Both the client (iframe src) and the Worker (/api/availability) import
 * from this file, so a pattern change is a one-line change here.
 *
 * Template variables available in `urlTemplate`:
 *   {anilistId}  AniList media ID (primary key across the app)
 *   {episode}    1-based episode number
 *   {lang}       "sub" | "dub"
 *
 * Pattern verification notes (verified 2026-11-08):
 *   megaplay  https://megaplay.buzz/stream/ani/{anilistId}/{episode}/{lang}
 *             (confirmed in public integrations; mal/ and s-2/ variants exist)
 *   anixo     https://anixo.buzz/embed/ani/{anilistId}/{episode}/{lang}
 *             (confirmed in public integrations)
 *   tryembed  https://tryembed.us.cc/embed/anime/{anilistId}/{episode}/{lang}
 *             (reported pattern, NOT independently confirmed — verify)
 *   vidnest   https://vidnest.fun/anime/{anilistId}/{episode}/{lang}
 *             (observed redirect target; site may require Referer — verify)
 *
 * Providers are ordered by preference: auto-fallback tries each in order.
 */

export const PROVIDERS = [
  {
    id: 'megaplay',
    name: 'MegaPlay',
    urlTemplate: 'https://megaplay.buzz/stream/ani/{anilistId}/{episode}/{lang}',
    supports: ['sub', 'dub'],
    sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-presentation',
  },
  {
    id: 'anixo',
    name: 'AniXo',
    urlTemplate: 'https://anixo.buzz/embed/ani/{anilistId}/{episode}/{lang}',
    supports: ['sub', 'dub'],
    // @TODO verify AniXo dub coverage; if DUB is unsupported, remove 'dub'.
    sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-presentation',
  },
  {
    id: 'tryembed',
    name: 'TryEmbed',
    urlTemplate: 'https://tryembed.us.cc/embed/anime/{anilistId}/{episode}/{lang}',
    supports: ['sub', 'dub'],
    // @TODO confirm the tryembed pattern (see header). Placeholder if wrong:
    //       https://tryembed.us.cc/embed/{anilistId}/{episode}/{lang}
    sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-presentation',
  },
  {
    id: 'vidnest',
    name: 'VidNest',
    urlTemplate: 'https://vidnest.fun/anime/{anilistId}/{episode}/{lang}',
    supports: ['sub', 'dub'],
    // @TODO vidnest appears to expect a Referer of an upstream site when
    //       hot-linking. If iframes stay blank, either drop this provider or
    //       serve it through a same-origin proxy in functions/api/.
    sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-presentation',
  },
];

export const PROVIDER_IDS = PROVIDERS.map((p) => p.id);

export const LANGS = ['sub', 'dub'];

/** Look up a provider by id, falling back to the first provider. */
export function getProvider(id) {
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];
}

/**
 * Build an embed URL for a provider.
 * Returns null when the provider does not support the requested language.
 */
export function buildEmbedUrl(providerOrId, { anilistId, episode, lang = 'sub' }) {
  const provider = typeof providerOrId === 'string' ? getProvider(providerOrId) : providerOrId;
  const safeLang = lang === 'dub' ? 'dub' : 'sub';
  if (!provider.supports.includes(safeLang)) return null;
  if (!Number.isInteger(Number(anilistId)) || !Number.isInteger(Number(episode))) return null;
  return provider.urlTemplate
    .replaceAll('{anilistId}', String(anilistId))
    .replaceAll('{episode}', String(episode))
    .replaceAll('{lang}', safeLang);
}

/** Hostnames used as iframe origins (needed for postMessage / CSP allowlists). */
export const PROVIDER_ORIGINS = PROVIDERS.map((p) => new URL(p.urlTemplate).origin);
