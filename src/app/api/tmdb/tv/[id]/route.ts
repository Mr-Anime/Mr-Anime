import { cacheHeader, jsonError, mediaIdParamSchema } from "@/lib/api";
import { getTmdbTv, isTmdbConfigured } from "@/lib/tmdb/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Params): Promise<Response> {
  if (!isTmdbConfigured()) return jsonError("TMDB is not configured", 503);

  const { id } = await ctx.params;
  const parsed = mediaIdParamSchema.safeParse({ id });
  if (!parsed.success) return jsonError("Invalid TMDB id", 400);

  try {
    const tv = await getTmdbTv(parsed.data.id);
    return Response.json({ tv }, { headers: cacheHeader(21_600) });
  } catch (error) {
    console.error("tmdb tv failed", error);
    return jsonError("TMDB is unavailable", 502);
  }
}
