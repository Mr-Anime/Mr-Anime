import { getSeasonal } from "@/lib/anilist/anime";
import { cacheHeader, handleUpstreamError, jsonError, listParamsSchema } from "@/lib/api";
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

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const now = new Date();
  const parsed = seasonalSchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    perPage: url.searchParams.get("perPage") ?? undefined,
    season: url.searchParams.get("season") ?? currentSeason(now),
    year: url.searchParams.get("year") ?? now.getFullYear(),
  });
  if (!parsed.success) return jsonError("Invalid seasonal parameters", 400);

  try {
    const result = await getSeasonal(
      parsed.data.season,
      parsed.data.year,
      parsed.data.page,
      parsed.data.perPage,
    );
    return Response.json(result, { headers: cacheHeader(3600) });
  } catch (error) {
    return handleUpstreamError(error);
  }
}
