import { cacheHeader, jsonError } from "@/lib/api";
import { isTmdbConfigured, searchTmdbTv } from "@/lib/tmdb/client";
import { z } from "zod";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().trim().min(1).max(200),
  year: z.coerce.number().int().min(1950).max(2100).optional(),
});

export async function GET(request: Request): Promise<Response> {
  if (!isTmdbConfigured()) return jsonError("TMDB is not configured", 503);

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    year: url.searchParams.get("year") ?? undefined,
  });
  if (!parsed.success) return jsonError("Invalid search query", 400);

  try {
    const results = await searchTmdbTv(parsed.data.q, parsed.data.year);
    return Response.json({ results }, { headers: cacheHeader(600) });
  } catch (error) {
    console.error("tmdb search failed", error);
    return jsonError("TMDB is unavailable", 502);
  }
}
