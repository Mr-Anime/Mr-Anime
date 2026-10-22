import "server-only";
import type { Media, PageResult } from "@/lib/anilist/types";
import { cacheKey, getCached, setCached } from "@/lib/data-cache";

const KITSU_ENDPOINT = "https://kitsu.io/api/edge";
const MAX_PAGE_SIZE = 20;

type KitsuAttributes = {
  canonicalTitle?: string | null;
  titles?: {
    en?: string | null;
    en_jp?: string | null;
    en_us?: string | null;
    ja_jp?: string | null;
  } | null;
  synopsis?: string | null;
  description?: string | null;
  averageRating?: string | null;
  userCount?: number | null;
  favoritesCount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  episodeCount?: number | null;
  episodeLength?: number | null;
  subtype?: string | null;
  status?: string | null;
  posterImage?: {
    medium?: string | null;
    large?: string | null;
    original?: string | null;
  } | null;
  coverImage?: {
    large?: string | null;
    original?: string | null;
  } | null;
  youtubeVideoId?: string | null;
  nsfw?: boolean | null;
  abbreviatedTitles?: string[] | null;
};

type KitsuResource = {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<
    string,
    { data?: { id?: string; type?: string } | { id?: string; type?: string }[] | null }
  >;
};

type KitsuAnime = KitsuResource & {
  type: "anime";
  attributes: KitsuAttributes;
};

type KitsuMapping = KitsuResource & {
  type: "mappings";
};

type KitsuResponse<T> = {
  data?: T;
  included?: KitsuResource[];
  meta?: { count?: number };
  errors?: { title?: string; detail?: string }[];
};

export type KitsuPageQuery = {
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

function pageSize(perPage?: number): number {
  return Math.max(1, Math.min(perPage ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE));
}

function includedMap(included?: KitsuResource[]): Map<string, KitsuResource> {
  return new Map((included ?? []).map((resource) => [resource.id, resource]));
}

function relationshipIds(resource: KitsuResource, key: string): string[] {
  const data = resource.relationships?.[key]?.data;
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.flatMap((item) => (item.id ? [item.id] : []));
  }
  return data.id ? [data.id] : [];
}

function anilistIdFor(
  resource: KitsuResource,
  included: Map<string, KitsuResource>,
): number | null {
  for (const mappingId of relationshipIds(resource, "mappings")) {
    const mapping = included.get(mappingId);
    if (mapping?.attributes?.externalSite !== "anilist/anime") continue;
    const id = Number(mapping.attributes.externalId);
    if (Number.isInteger(id) && id > 0) return id;
  }
  return null;
}

function genresFor(
  resource: KitsuResource,
  included: Map<string, KitsuResource>,
): string[] {
  return relationshipIds(resource, "categories").flatMap((id) => {
    const title = included.get(id)?.attributes?.title;
    return typeof title === "string" ? [title] : [];
  });
}

function dateParts(
  value: string | null | undefined,
): { year: number; month?: number; day?: number } | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!Number.isFinite(year) || year <= 0) return undefined;
  return {
    year,
    month: Number.isFinite(month) && month > 0 ? month : undefined,
    day: Number.isFinite(day) && day > 0 ? day : undefined,
  };
}

function seasonFor(month: number | undefined): string | null {
  if (!month) return null;
  if (month <= 3) return "WINTER";
  if (month <= 6) return "SPRING";
  if (month <= 9) return "SUMMER";
  return "FALL";
}

function mapStatus(status: string | null | undefined): string | null {
  switch (status?.toLowerCase()) {
    case "current":
      return "RELEASING";
    case "finished":
      return "FINISHED";
    case "tba":
    case "unreleased":
    case "upcoming":
      return "NOT_YET_RELEASED";
    default:
      return status ? status.toUpperCase() : null;
  }
}

function mapFormat(format: string | null | undefined): string | null {
  switch (format?.toUpperCase()) {
    case "TV":
      return "TV";
    case "TV_SHORT":
      return "TV";
    case "MOVIE":
      return "MOVIE";
    case "OVA":
      return "OVA";
    case "ONA":
      return "ONA";
    case "SPECIAL":
      return "SPECIAL";
    case "MUSIC":
      return "MUSIC";
    default:
      return format ? format.toUpperCase() : null;
  }
}

function statusFilter(status: string | null | undefined): string | null {
  switch (status?.toUpperCase()) {
    case "RELEASING":
      return "current";
    case "FINISHED":
      return "finished";
    case "NOT_YET_RELEASED":
      return "tba";
    case "HIATUS":
      return "current";
    default:
      return null;
  }
}

function formatFilter(format: string | null | undefined): string | null {
  switch (format?.toUpperCase()) {
    case "TV":
    case "TV_SHORT":
      return "TV";
    case "MOVIE":
      return "movie";
    case "OVA":
      return "OVA";
    case "ONA":
      return "ONA";
    case "SPECIAL":
      return "special";
    case "MUSIC":
      return "music";
    default:
      return null;
  }
}

function genreSlug(genre: string): string {
  return genre
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sortFor(sort: string[] | undefined, hasSearch: boolean): string | null {
  const value = sort?.[0];
  if (value === "SCORE_DESC") return "-averageRating";
  if (value === "START_DATE_DESC") return "-startDate";
  if (value === "POPULARITY_DESC" || value === "TRENDING_DESC") return "-userCount";
  return hasSearch ? null : "-userCount";
}

function stableImage(...urls: (string | null | undefined)[]): string | null {
  const usable = urls.filter((url): url is string => Boolean(url));
  return usable.find((url) => !/[?&]X-Amz-/i.test(url)) ?? usable[0] ?? null;
}

function mapMedia(
  resource: KitsuAnime,
  included: Map<string, KitsuResource>,
): Media | null {
  const attributes = resource.attributes;
  const id = anilistIdFor(resource, included);
  if (!id || attributes.nsfw) return null;

  const startDate = dateParts(attributes.startDate);
  const rating = Number.parseFloat(attributes.averageRating ?? "");
  const score = Number.isFinite(rating) ? Math.round(rating) : null;
  const titles = attributes.titles ?? {};

  return {
    id,
    type: "ANIME",
    status: mapStatus(attributes.status),
    format: mapFormat(attributes.subtype),
    episodes: attributes.episodeCount ?? null,
    duration: attributes.episodeLength ?? null,
    season: seasonFor(startDate?.month),
    seasonYear: startDate?.year ?? null,
    averageScore: score,
    meanScore: score,
    popularity: attributes.userCount ?? null,
    favourites: attributes.favoritesCount ?? null,
    genres: genresFor(resource, included),
    description: attributes.synopsis ?? attributes.description ?? null,
    bannerImage: stableImage(
      attributes.coverImage?.original,
      attributes.coverImage?.large,
    ),
    coverImage: {
      extraLarge: stableImage(
        attributes.posterImage?.large,
        attributes.posterImage?.medium,
        attributes.posterImage?.original,
      ),
      large: stableImage(
        attributes.posterImage?.medium,
        attributes.posterImage?.large,
        attributes.posterImage?.original,
      ),
      color: null,
    },
    title: {
      romaji: titles.en_jp ?? attributes.canonicalTitle ?? null,
      english: titles.en ?? titles.en_us ?? null,
      native: titles.ja_jp ?? null,
    },
    startDate,
    endDate: dateParts(attributes.endDate),
    nextAiringEpisode: null,
    trailer: attributes.youtubeVideoId
      ? { id: attributes.youtubeVideoId, site: "youtube" }
      : null,
    isAdult: false,
    synonyms: attributes.abbreviatedTitles ?? [],
  };
}

async function kitsuRequest<T>(
  path: string,
  params: Record<string, string>,
  ttlSeconds: number,
): Promise<KitsuResponse<T>> {
  const key = cacheKey("kitsu", { path, params });
  const cached = getCached<KitsuResponse<T>>(key);
  if (cached !== undefined) return cached;

  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${KITSU_ENDPOINT}${path}${query ? `?${query}` : ""}`, {
    headers: { Accept: "application/vnd.api+json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Kitsu request failed (${response.status})`);
  }

  const json = (await response.json()) as KitsuResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors[0]?.detail ?? "Kitsu returned an error");
  }
  if (json.data === undefined) {
    throw new Error("Kitsu returned no data");
  }

  setCached(key, json, Math.min(ttlSeconds, 720));
  return json;
}

export async function getKitsuPage(
  query: KitsuPageQuery,
  ttlSeconds: number,
): Promise<PageResult> {
  const page = Math.max(1, query.page ?? 1);
  const limit = pageSize(query.perPage);
  const offset = (page - 1) * limit;
  const search = query.search?.trim();
  const params: Record<string, string> = {
    "page[limit]": String(limit),
    "page[offset]": String(offset),
    include: "mappings,categories",
  };

  if (search) params["filter[text]"] = search;

  const status = statusFilter(query.status);
  if (status) {
    params["filter[status]"] = status;
  } else if (!search && query.sort?.includes("TRENDING_DESC")) {
    params["filter[status]"] = "current";
  }

  if (query.season) params["filter[season]"] = query.season.toLowerCase();
  if (query.seasonYear) params["filter[year]"] = String(query.seasonYear);
  if (query.genre) params["filter[categories]"] = genreSlug(query.genre);

  const subtype = formatFilter(query.format);
  if (subtype) params["filter[subtype]"] = subtype;

  const sort = sortFor(query.sort, Boolean(search));
  if (sort) params.sort = sort;

  const json = await kitsuRequest<KitsuAnime[]>("/anime", params, ttlSeconds);
  const included = includedMap(json.included);
  const data = json.data ?? [];
  const items = data
    .map((resource) => mapMedia(resource, included))
    .filter((media): media is Media => media !== null);
  const total = json.meta?.count ?? null;

  return {
    items,
    pageInfo: {
      currentPage: page,
      total,
      hasNextPage: total !== null && offset + data.length < total,
    },
  };
}

export async function getKitsuMediaByAnilistId(
  anilistId: number,
  ttlSeconds: number,
): Promise<Media | null> {
  if (!Number.isInteger(anilistId) || anilistId <= 0) return null;

  const mapping = await kitsuRequest<KitsuMapping[]>(
    "/mappings",
    {
      "filter[externalSite]": "anilist/anime",
      "filter[externalId]": String(anilistId),
      include: "item",
      "page[limit]": "1",
    },
    ttlSeconds,
  );

  const kitsuId = mapping.data?.[0]?.relationships?.item?.data;
  const id = Array.isArray(kitsuId) ? kitsuId[0]?.id : kitsuId?.id;
  if (!id) return null;

  const anime = await kitsuRequest<KitsuAnime>(
    `/anime/${id}`,
    { include: "mappings,categories" },
    ttlSeconds,
  );
  if (!anime.data) return null;

  return mapMedia(anime.data, includedMap(anime.included));
}

export async function getKitsuMediaByIds(
  ids: number[],
  ttlSeconds: number,
): Promise<Media[]> {
  const out: Media[] = [];
  for (const id of ids.slice(0, MAX_PAGE_SIZE)) {
    try {
      const media = await getKitsuMediaByAnilistId(id, ttlSeconds);
      if (media) out.push(media);
    } catch {
      continue;
    }
  }
  return out;
}
