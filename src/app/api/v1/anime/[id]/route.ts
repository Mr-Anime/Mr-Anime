import { getAnimeDetails } from "@/lib/anilist/anime";
import { cacheHeader, mediaIdParamSchema } from "@/lib/api";
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return authFailureResponse(auth);

  const { id } = await params;
  const parsed = mediaIdParamSchema.safeParse({ id });
  if (!parsed.success) {
    return apiV1Error("invalid_params", "Invalid anime id", 400);
  }

  try {
    const media = await getAnimeDetails(parsed.data.id);
    if (!media) {
      return apiV1Error("not_found", "No anime exists with that id.", 404);
    }
    return apiV1Json(
      { data: mapApiAnime(media) },
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
