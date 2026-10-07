import { searchAnime } from "@/lib/anilist/anime";
import { cacheHeader, handleUpstreamError, jsonError, searchParamsSchema } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sp = url.searchParams;
  const parsed = searchParamsSchema.safeParse({
    page: sp.get("page") ?? undefined,
    perPage: sp.get("perPage") ?? undefined,
    q: sp.get("q") ?? undefined,
    genre: sp.get("genre") ?? undefined,
    year: sp.get("year") ?? undefined,
    season: sp.get("season") ?? undefined,
    format: sp.get("format") ?? undefined,
    status: sp.get("status") ?? undefined,
    sort: sp.get("sort") ?? undefined,
  });
  if (!parsed.success) return jsonError("Invalid search parameters", 400);

  try {
    const result = await searchAnime({
      page: parsed.data.page,
      perPage: parsed.data.perPage,
      search: parsed.data.q ?? null,
      genre: parsed.data.genre ?? null,
      season: parsed.data.season ?? null,
      seasonYear: parsed.data.year ?? null,
      format: parsed.data.format ?? null,
      status: parsed.data.status ?? null,
      sort: parsed.data.sort ? [parsed.data.sort] : undefined,
    });
    return Response.json(result, { headers: cacheHeader(600) });
  } catch (error) {
    return handleUpstreamError(error);
  }
}
