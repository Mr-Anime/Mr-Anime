import "server-only";
import { cacheKey, getCached, setCached } from "@/lib/data-cache";
import { cacheTtl } from "@/lib/config";

const TMDB_BASE = "https://api.themoviedb.org/3";

export class TmdbNotConfiguredError extends Error {
  constructor() {
    super("TMDB is not configured (TMDB_READ_ACCESS_TOKEN missing)");
    this.name = "TmdbNotConfiguredError";
  }
}

export function isTmdbConfigured(): boolean {
  return Boolean(process.env.TMDB_READ_ACCESS_TOKEN);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  ttlSeconds: number,
): Promise<T> {
  if (!isTmdbConfigured()) throw new TmdbNotConfiguredError();

  const key = cacheKey(`tmdb:${path}`, params);
  const cached = getCached<T>(key);
  if (cached !== undefined) return cached;

  const url = new URL(`${TMDB_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  const doFetch = () =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
        accept: "application/json",
      },
      cache: "no-store",
    });

  let response = await doFetch();
  for (let attempt = 0; attempt < 2 && response.status === 429; attempt++) {
    await sleep(1_000 * (attempt + 1));
    response = await doFetch();
  }

  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status}) for ${path}`);
  }

  const json = (await response.json()) as T;
  setCached(key, json, ttlSeconds);
  return json;
}

export type TmdbTvSummary = {
  id: number;
  name: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  vote_average?: number;
};

export type TmdbSearchResult = TmdbTvSummary & {
  media_type?: string;
};

export type TmdbEpisode = {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview?: string;
  still_path?: string | null;
  air_date?: string | null;
  vote_average?: number;
};

export type TmdbSeason = {
  id: number;
  name: string;
  season_number: number;
  overview?: string;
  poster_path?: string | null;
  episodes: TmdbEpisode[];
};

export async function searchTmdbTv(
  query: string,
  year?: number | null,
): Promise<TmdbSearchResult[]> {
  const data = await tmdbFetch<{ results: TmdbSearchResult[] }>(
    "/search/tv",
    { query, first_air_date_year: year ?? undefined, include_adult: "false" },
    cacheTtl.search,
  );
  return data.results ?? [];
}

export async function getTmdbTv(id: number): Promise<TmdbTvSummary> {
  return tmdbFetch<TmdbTvSummary>(
    `/tv/${id}`,
    { language: "en-US" },
    cacheTtl.details,
  );
}

export async function getTmdbSeason(
  id: number,
  seasonNumber: number,
): Promise<TmdbSeason> {
  return tmdbFetch<TmdbSeason>(
    `/tv/${id}/season/${seasonNumber}`,
    { language: "en-US" },
    cacheTtl.details,
  );
}

export type TmdbVideo = {
  key: string;
  site: string;
  type: string;
  name: string;
};

export async function getTmdbVideos(id: number): Promise<TmdbVideo[]> {
  const data = await tmdbFetch<{ results: TmdbVideo[] }>(
    `/tv/${id}/videos`,
    { language: "en-US" },
    cacheTtl.details,
  );
  return data.results ?? [];
}

/**
 * Find the TMDB TV id for an AniList title by searching title + year.
 * Returns null when TMDB is not configured or nothing matches.
 */
export async function matchTmdbForTitle(
  title: string,
  year?: number | null,
): Promise<TmdbTvSummary | null> {
  if (!title) return null;
  try {
    const results = await searchTmdbTv(title, year);
    return results[0] ?? null;
  } catch (error) {
    if (error instanceof TmdbNotConfiguredError) return null;
    throw error;
  }
}
