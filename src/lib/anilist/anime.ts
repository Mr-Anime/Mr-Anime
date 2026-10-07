import "server-only";
import { anilistRequest } from "@/lib/anilist/client";
import { MEDIA_DETAILS_QUERY, PAGE_MEDIA_QUERY } from "@/lib/anilist/queries";
import type { Media, PageResult } from "@/lib/anilist/types";
import { cacheTtl } from "@/lib/config";

type PageQuery = {
  page?: number;
  perPage?: number;
  sort?: string[];
  season?: string | null;
  seasonYear?: number | null;
  genre?: string | null;
  status?: string | null;
  format?: string | null;
  search?: string | null;
};

async function fetchPage(q: PageQuery, ttl: number): Promise<PageResult> {
  const data = await anilistRequest<{
    Page: { pageInfo: PageResult["pageInfo"]; media: Media[] };
  }>(
    PAGE_MEDIA_QUERY,
    {
      page: q.page ?? 1,
      perPage: q.perPage ?? 24,
      sort: q.sort ?? ["TRENDING_DESC"],
      type: "ANIME",
      season: q.season ?? undefined,
      seasonYear: q.seasonYear ?? undefined,
      genre: q.genre ?? undefined,
      status: q.status ?? undefined,
      format: q.format ?? undefined,
      search: q.search ?? undefined,
    },
    ttl,
  );

  return { items: data.Page.media ?? [], pageInfo: data.Page.pageInfo };
}

export function getTrending(page = 1, perPage = 20) {
  return fetchPage({ page, perPage, sort: ["TRENDING_DESC"] }, cacheTtl.trending);
}

export function getPopular(page = 1, perPage = 24) {
  return fetchPage({ page, perPage, sort: ["POPULARITY_DESC"] }, cacheTtl.trending);
}

export function getTopRated(page = 1, perPage = 24) {
  return fetchPage({ page, perPage, sort: ["SCORE_DESC"] }, cacheTtl.trending);
}

export function getSeasonal(
  season: string,
  year: number,
  page = 1,
  perPage = 24,
) {
  return fetchPage(
    { page, perPage, sort: ["POPULARITY_DESC"], season, seasonYear: year },
    cacheTtl.trending,
  );
}

export function searchAnime(params: PageQuery) {
  const sort = params.sort ?? (params.search ? ["SEARCH_MATCH"] : ["TRENDING_DESC"]);
  return fetchPage({ ...params, sort, search: params.search || undefined }, cacheTtl.search);
}

export async function getAnimeDetails(id: number): Promise<Media | null> {
  try {
    const data = await anilistRequest<{ Media: Media | null }>(
      MEDIA_DETAILS_QUERY,
      { id },
      cacheTtl.details,
    );
    return data.Media;
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}
