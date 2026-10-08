import { getAnimeDetails } from "@/lib/anilist/anime";
import { cacheHeader, mediaIdParamSchema } from "@/lib/api";
import type { AudioLang } from "@/config/providers";
import { authenticateApiRequest } from "@/lib/api-auth";
import {
  apiV1Error,
  apiV1Json,
  authFailureResponse,
  corsPreflight,
  intQuery,
  mapApiAnime,
  upstreamV1Error,
} from "@/lib/api-v1";
import { getPlayerData } from "@/lib/player-data";

export const runtime = "nodejs";

export function OPTIONS(): Response {
  return corsPreflight();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; episode: string }> },
): Promise<Response> {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return authFailureResponse(auth);

  const { id, episode: episodeParam } = await params;
  const parsedId = mediaIdParamSchema.safeParse({ id });
  if (!parsedId.success) {
    return apiV1Error("invalid_params", "Invalid anime id", 400);
  }
  if (!/^\d+$/.test(episodeParam)) {
    return apiV1Error("invalid_params", "Invalid episode number", 400);
  }
  const episode = Number(episodeParam);
  if (episode < 1 || episode > 10000) {
    return apiV1Error("invalid_params", "Invalid episode number", 400);
  }

  const sp = new URL(request.url).searchParams;
  const season = intQuery(sp, "season", { fallback: 1, min: 1, max: 9999 });
  if (season === null) {
    return apiV1Error("invalid_params", "Invalid season parameter", 400);
  }
  const lang: AudioLang = sp.get("lang") === "dub" ? "dub" : "sub";

  try {
    const media = await getAnimeDetails(parsedId.data.id);
    if (!media) {
      return apiV1Error("not_found", "No anime exists with that id.", 404);
    }

    const player = await getPlayerData(media, episode, season, lang);
    if (!player) {
      return apiV1Error(
        "not_found",
        `Episode ${episode} does not exist for this anime.`,
        404,
      );
    }

    return apiV1Json(
      {
        data: {
          anime: mapApiAnime(media),
          episode: player.episode,
          season,
          requestedLang: player.requestedLang,
          effectiveLang: player.effectiveLang,
          dubAvailable: player.dubAvailable,
          dubMissing: player.dubMissing,
          providers: player.providers.map((p) => ({
            id: p.id,
            name: p.name,
            url: p.url,
            dubAvailable: p.dubOk,
          })),
        },
      },
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
