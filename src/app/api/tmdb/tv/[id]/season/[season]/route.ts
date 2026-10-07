import { cacheHeader, jsonError, mediaIdParamSchema } from "@/lib/api";
import { getTmdbSeason, isTmdbConfigured } from "@/lib/tmdb/client";
import { z } from "zod";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; season: string }> };

const seasonSchema = z.coerce.number().int().min(0).max(200);

export async function GET(_request: Request, ctx: Params): Promise<Response> {
  if (!isTmdbConfigured()) return jsonError("TMDB is not configured", 503);

  const { id, season } = await ctx.params;
  const idParsed = mediaIdParamSchema.safeParse({ id });
  const seasonParsed = seasonSchema.safeParse(season);
  if (!idParsed.success || !seasonParsed.success) {
    return jsonError("Invalid season parameters", 400);
  }

  try {
    const data = await getTmdbSeason(idParsed.data.id, seasonParsed.data);
    return Response.json({ season: data }, { headers: cacheHeader(21_600) });
  } catch (error) {
    console.error("tmdb season failed", error);
    return jsonError("TMDB is unavailable", 502);
  }
}
