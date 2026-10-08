import { getPopular } from "@/lib/anilist/anime";
import { cacheHeader, listParamsSchema } from "@/lib/api";
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

  const url = new URL(request.url);
  const parsed = listParamsSchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    perPage: url.searchParams.get("perPage") ?? undefined,
  });
  if (!parsed.success) {
    return apiV1Error("invalid_params", "Invalid pagination parameters", 400);
  }

  try {
    const result = await getPopular(parsed.data.page, parsed.data.perPage);
    return apiV1Json(
      { data: result.items.map(mapApiAnime), pageInfo: result.pageInfo },
      {
        headers: {
          ...cacheHeader(3600),
          "X-RateLimit-Remaining": String(auth.remaining),
        },
      },
    );
  } catch (error) {
    return upstreamV1Error(error);
  }
}
