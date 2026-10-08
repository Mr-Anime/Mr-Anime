import { getAnimeDetails } from "@/lib/anilist/anime";
import { cacheHeader, mediaIdParamSchema } from "@/lib/api";
import { authenticateApiRequest } from "@/lib/api-auth";
import {
  apiV1Error,
  apiV1Json,
  authFailureResponse,
  corsPreflight,
  intQuery,
  upstreamV1Error,
} from "@/lib/api-v1";
import { getEpisodeList } from "@/lib/player-data";

export const runtime = "nodejs";

export function OPTIONS(): Response {
  return corsPreflight();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return authFailureResponse(auth);

  const { id } = await params;
  const parsedId = mediaIdParamSchema.safeParse({ id });
  if (!parsedId.success) {
    return apiV1Error("invalid_params", "Invalid anime id", 400);
  }

  const season = intQuery(new URL(request.url).searchParams, "season", {
    fallback: 1,
    min: 1,
    max: 9999,
  });
  if (season === null) {
    return apiV1Error("invalid_params", "Invalid season parameter", 400);
  }

  try {
    const media = await getAnimeDetails(parsedId.data.id);
    if (!media) {
      return apiV1Error("not_found", "No anime exists with that id.", 404);
    }

    const { episodes, count } = await getEpisodeList(media, season);
    return apiV1Json(
      { data: episodes, meta: { episodes: count, season } },
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
