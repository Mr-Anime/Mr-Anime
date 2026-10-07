import "server-only";

/**
 * Playback providers are configured ONLY via environment variables — never
 * hard-coded. Set PROVIDER_1_BASE / PROVIDER_1_NAME, PROVIDER_2_BASE, …
 *
 * Two base URL styles:
 *  1. Template:  https://embed.example/e/{id}/{ep}   tokens: {id} {ep} {title}
 *                {tmdb} {season}   (tmdb = TMDB TV id, may be empty)
 *  2. Plain base: https://embed.example/e
 *       → appended as ?id=<anilistId>&ep=<episode>&season=<n>[&tmdb=<id>]
 *
 * Provider origins are automatically added to the CSP frame-src by
 * next.config.ts (PROVIDER_\d+_BASE).
 */

export type Provider = {
  id: string;
  name: string;
  base: string;
};

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

export type EmbedInput = {
  mediaId: number;
  episode: number;
  title: string;
  tmdbId?: number | null;
  season?: number | null;
};

export function buildUrl(provider: Provider, input: EmbedInput): string {
  const vars: Record<string, string> = {
    id: String(input.mediaId),
    ep: String(input.episode),
    episode: String(input.episode),
    title: input.title,
    tmdb: input.tmdbId ? String(input.tmdbId) : "",
    season: String(input.season ?? 1),
  };

  if (/\{\w+\}/.test(provider.base)) {
    return provider.base.replace(/{(\w+)}/g, (_m, key: string) => vars[key] ?? "");
  }

  try {
    const url = new URL(provider.base);
    url.searchParams.set("id", vars.id);
    url.searchParams.set("ep", vars.ep);
    url.searchParams.set("season", vars.season);
    if (vars.tmdb) url.searchParams.set("tmdb", vars.tmdb);
    return url.toString();
  } catch {
    // Malformed base (should have been caught by CSP config) — return as-is.
    return provider.base;
  }
}
