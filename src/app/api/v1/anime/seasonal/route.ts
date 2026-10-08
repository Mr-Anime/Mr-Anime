import { getSeasonal } from "@/lib/anilist/anime";
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
import { z } from "zod";

export const runtime = "nodejs";

const seasonalSchema = listParamsSchema.extend({
  season: z.enum(["WINTER", "SPRING", "SUMMER", "FALL"]),
  year: z.coerce.number().int().min(1970).max(2100),
});

function currentSeason(date = new Date()) {
  const m = date.getMonth();
  if (m <= 1 || m === 11) return "WINTER";
  if (m <= 4) return "SPRING";
  if (m <= 7) return "SUMMER";
  return "FALL";
}

export function OPTIONS(): Response {
  return corsPreflight();
}

export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return authFailureResponse(auth);

  const url = new URL(request.url);
  const now = new Date();
  const parsed = seasonalSchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    perPage: url.searchParams.get("perPage") ?? undefined,
    season: url.searchParams.get("season") ?? currentSeason(now),
    year: url.searchParams.get("year") ?? now.getFullYear(),
  });
  if (!parsed.success) {
    return apiV1Error("invalid_params", "Invalid seasonal parameters", 400);
  }

  try {
    const result = await getSeasonal(
      parsed.data.season,
      parsed.data.year,
      parsed.data.page,
      parsed.data.perPage,
    );
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
