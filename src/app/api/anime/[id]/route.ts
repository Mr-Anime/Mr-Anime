import { getAnimeDetails } from "@/lib/anilist/anime";
import { cacheHeader, handleUpstreamError, jsonError, mediaIdParamSchema } from "@/lib/api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Params): Promise<Response> {
  const { id } = await ctx.params;
  const parsed = mediaIdParamSchema.safeParse({ id });
  if (!parsed.success) return jsonError("Invalid anime id", 400);

  try {
    const media = await getAnimeDetails(parsed.data.id);
    if (!media) return jsonError("Anime not found", 404);
    return Response.json({ media }, { headers: cacheHeader(21_600) });
  } catch (error) {
    return handleUpstreamError(error);
  }
}
