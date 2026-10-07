import { z } from "zod";
import { AniListError } from "@/lib/anilist/client";

/** Shared helpers for our proxy route handlers. */

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export function handleUpstreamError(error: unknown): Response {
  if (error instanceof AniListError) {
    if (error.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited by AniList" }), {
        status: 429,
        headers: { "Retry-After": "5", "Content-Type": "application/json" },
      });
    }
    return jsonError(error.message, 502);
  }
  console.error("upstream error", error);
  return jsonError("Upstream data provider is unavailable", 502);
}

export function cacheHeader(seconds: number): Record<string, string> {
  return {
    "Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
  };
}

export const listParamsSchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(24),
});

export const searchParamsSchema = listParamsSchema.extend({
  q: z.string().trim().max(200).optional(),
  genre: z.string().trim().max(50).optional(),
  year: z.coerce.number().int().min(1950).max(2100).optional(),
  season: z.enum(["WINTER", "SPRING", "SUMMER", "FALL"]).optional(),
  format: z.enum(["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"]).optional(),
  status: z.enum(["RELEASING", "FINISHED", "NOT_YET_RELEASED", "CANCELLED"]).optional(),
  sort: z
    .enum([
      "SEARCH_MATCH",
      "TRENDING_DESC",
      "POPULARITY_DESC",
      "SCORE_DESC",
      "START_DATE_DESC",
      "FAVOURITES_DESC",
    ])
    .optional(),
});

export const mediaIdParamSchema = z.object({
  id: z.coerce.number().int().positive().max(999_999_999),
});
