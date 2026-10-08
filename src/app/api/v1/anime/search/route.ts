import { searchAnime } from "@/lib/anilist/anime";
import { cacheHeader, searchParamsSchema } from "@/lib/api";
import { authenticateApiRequest } from "@/lib/api-auth";
import {
  apiV1Error,
  apiV1Json,
  authFailureResponse,
  corsPreflight,
  mapApiAnime,
  upstreamV1Error,
} from "@/lib/api-v1";

export const runtime = "nodejs";

export function OPTIONS(): Response {
  return corsPreflight();
}

export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return authFailureResponse(auth);

  const sp = new URL(request.url).searchParams;
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
  if (!parsed.success) {
    return apiV1Error("invalid_params", "Invalid search parameters", 400);
  }

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
    return apiV1Json(
      { data: result.items.map(mapApiAnime), pageInfo: result.pageInfo },
      {
        headers: {
          ...cacheHeader(600),
          "X-RateLimit-Remaining": String(auth.remaining),
        },
      },
    );
  } catch (error) {
    return upstreamV1Error(error);
  }
}
