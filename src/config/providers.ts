import "server-only";

/**
 * Playback providers are configured ONLY via environment variables — never
 * hard-coded. Set PROVIDER_1_BASE / PROVIDER_1_NAME, PROVIDER_2_BASE, …
 *
 * Two base URL styles:
 *  1. Template:  https://embed.example/e/{id}/{ep}   tokens: {id} {ep} {title}
 *                {tmdb} {season} {lang}   (tmdb = TMDB TV id, may be empty;
 *                lang = "sub" | "dub")
 *  2. Plain base: https://embed.example/e
 *       → appended as ?id=<anilistId>&ep=<episode>&season=<n>[&tmdb=<id>]
 *
 * Language: three mechanisms, tried in order —
 *  1. explicit {lang} token in the template (preferred),
 *  2. a trailing literal /sub or /dub segment gets swapped (megaplay),
 *  3. otherwise "dub" appends a /dub segment (anixo-style /{ep} bases);
 *     "sub" leaves the URL untouched. Watch-page probes check availability
 *     and disable Dub when the provider has no dub file for the episode.
 *
 * Provider origins are automatically added to the CSP frame-src by
 * next.config.ts (PROVIDER_\d+_BASE).
 */

export type Provider = {
  id: string;
  name: string;
  base: string;
};

export type AudioLang = "sub" | "dub";

const MAX_PROVIDERS = 6;

export function getProviders(): Provider[] {
  const providers: Provider[] = [];
  for (let i = 1; i <= MAX_PROVIDERS; i++) {
    const base = process.env[`PROVIDER_${i}_BASE`]?.trim();
    if (!base) continue;
    const name = process.env[`PROVIDER_${i}_NAME`]?.trim() || `Provider ${i}`;
    providers.push({ id: `provider-${i}`, name, base: base.replace(/\/+$/, "") });
  }
  return providers;
}

export function anyProviderSupportsLang(providers: Provider[]): boolean {
  return providers.length > 0;
}

export type EmbedInput = {
  mediaId: number;
  episode: number;
  title: string;
  tmdbId?: number | null;
  season?: number | null;
  lang?: AudioLang;
};

export function buildUrl(provider: Provider, input: EmbedInput): string {
  const vars: Record<string, string> = {
    id: String(input.mediaId),
    ep: String(input.episode),
    episode: String(input.episode),
    title: input.title,
    tmdb: input.tmdbId ? String(input.tmdbId) : "",
    season: String(input.season ?? 1),
    lang: input.lang ?? "sub",
  };

  let url: string;
  if (/\{\w+\}/.test(provider.base)) {
    url = provider.base.replace(/{(\w+)}/g, (_m, key: string) => vars[key] ?? "");
  } else {
    try {
      const parsed = new URL(provider.base);
      parsed.searchParams.set("id", vars.id);
      parsed.searchParams.set("ep", vars.ep);
      parsed.searchParams.set("season", vars.season);
      if (vars.tmdb) parsed.searchParams.set("tmdb", vars.tmdb);
      url = parsed.toString();
    } catch {
      // Malformed base (should have been caught by CSP config) — return as-is.
      return provider.base;
    }
  }

  // Language fallbacks for bases without an explicit {lang} token.
  if (!provider.base.includes("{lang}")) {
    if (/\/(sub|dub)$/.test(url)) {
      url = url.replace(/\/(sub|dub)$/, `/${vars.lang}`);
    } else if (vars.lang === "dub" && !url.includes("?")) {
      url = `${url.replace(/\/+$/, "")}/dub`;
    }
  }
  return url;
}
