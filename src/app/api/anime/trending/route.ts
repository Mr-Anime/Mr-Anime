import { getTrending } from "@/lib/anilist/anime";
import {
  cacheHeader,
  handleUpstreamError,
  jsonError,
  listParamsSchema,
} from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const parsed = listParamsSchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    perPage: url.searchParams.get("perPage") ?? undefined,
  });
  if (!parsed.success) return jsonError("Invalid pagination parameters", 400);

  try {
    const result = await getTrending(parsed.data.page, parsed.data.perPage);
    return Response.json(result, { headers: cacheHeader(3600) });
  } catch (error) {
    return handleUpstreamError(error);
  }
}
