import { AniListError } from "@/lib/anilist/client";
import type { Media } from "@/lib/anilist/types";
import type { ApiAuthFailure } from "@/lib/api-auth";

/** Shared helpers for the public REST API (/api/v1). */

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-API-Key",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

/** Stable public shape of an anime object (identical for list + detail). */
export type ApiAnime = {
  id: number;
  type: "ANIME";
  title: { romaji: string | null; english: string | null; native: string | null };
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  endDate: { year: number | null; month: number | null; day: number | null };
  score: number | null;
  meanScore: number | null;
  popularity: number | null;
  favourites: number | null;
  genres: string[];
  description: string | null;
  cover: { extraLarge: string | null; large: string | null; color: string | null } | null;
  banner: string | null;
  studios: string[];
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  isAdult: boolean;
};

function stripHtml(text: string | null | undefined): string | null {
  if (!text) return null;
  const stripped = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped || null;
}

export function mapApiAnime(media: Media): ApiAnime {
  return {
    id: media.id,
    type: "ANIME",
    title: {
      romaji: media.title?.romaji ?? null,
      english: media.title?.english ?? null,
      native: media.title?.native ?? null,
    },
    format: media.format ?? null,
    status: media.status ?? null,
    episodes: media.episodes ?? null,
    duration: media.duration ?? null,
    season: media.season ?? null,
    seasonYear: media.seasonYear ?? null,
    startDate: {
      year: media.startDate?.year ?? null,
      month: media.startDate?.month ?? null,
      day: media.startDate?.day ?? null,
    },
    endDate: {
      year: media.endDate?.year ?? null,
      month: media.endDate?.month ?? null,
      day: media.endDate?.day ?? null,
    },
    score: media.averageScore ?? null,
    meanScore: media.meanScore ?? null,
    popularity: media.popularity ?? null,
    favourites: media.favourites ?? null,
    genres: media.genres ?? [],
    description: stripHtml(media.description),
    cover: media.coverImage
      ? {
          extraLarge: media.coverImage.extraLarge ?? null,
          large: media.coverImage.large ?? null,
          color: media.coverImage.color ?? null,
        }
      : null,
    banner: media.bannerImage ?? null,
    studios: media.studios?.nodes?.map((node) => node.name) ?? [],
    nextAiringEpisode: media.nextAiringEpisode ?? null,
    isAdult: media.isAdult ?? false,
  };
}

export function apiV1Json(
  data: unknown,
  {
    status = 200,
    headers,
  }: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return Response.json(data, { status, headers: { ...CORS_HEADERS, ...headers } });
}

export function apiV1Error(
  code: string,
  message: string,
  status: number,
  headers?: Record<string, string>,
): Response {
  return apiV1Json({ error: { code, message } }, { status, headers });
}

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function authFailureResponse(failure: ApiAuthFailure): Response {
  const headers: Record<string, string> = {};
  if (failure.retryAfterSeconds) {
    headers["Retry-After"] = String(failure.retryAfterSeconds);
  }
  return apiV1Error(failure.code, failure.message, failure.status, headers);
}

export function upstreamV1Error(error: unknown): Response {
  if (error instanceof AniListError) {
    if (error.status === 429) {
      return apiV1Error(
        "upstream_rate_limited",
        "Rate limited by the upstream data provider.",
        429,
        { "Retry-After": "5" },
      );
    }
    return apiV1Error("upstream_error", error.message, 502);
  }
  console.error("v1 upstream error", error);
  return apiV1Error("upstream_error", "Upstream data provider is unavailable.", 502);
}

/**
 * Whole-number query parameter. Returns the fallback when absent/empty and
 * null when the value is not an integer inside [min, max].
 */
export function intQuery(
  params: URLSearchParams,
  key: string,
  { fallback, min, max }: { fallback: number; min: number; max: number },
): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return value >= min && value <= max ? value : null;
}
