/**
 * AniList GraphQL -> app JSON shapes.
 * The output keys intentionally mirror src/api/mock.js so the UI (and mock
 * mode) behave identically.
 */

function pickCover(coverImage) {
  if (!coverImage) return null;
  return {
    extraLarge: coverImage.extraLarge || coverImage.large,
    large: coverImage.large || coverImage.extraLarge,
    color: coverImage.color ?? null,
  };
}

function pickTitle(title) {
  if (!title) return { english: null, romaji: null, native: null, userPreferred: null };
  return {
    english: title.english ?? null,
    romaji: title.romaji ?? null,
    native: title.native ?? null,
    userPreferred: title.userPreferred ?? title.romaji ?? null,
  };
}

function pickNextAiring(nextAiringEpisode) {
  if (!nextAiringEpisode) return null;
  return {
    episode: nextAiringEpisode.episode,
    airingAt: nextAiringEpisode.airingAt,
    timeUntilAiring: nextAiringEpisode.timeUntilAiring,
  };
}

/** Card shape used by grids, rows, recommendations and /api/anime/batch. */
export function toCard(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    title: pickTitle(raw.title),
    coverImage: pickCover(raw.coverImage),
    bannerImage: raw.bannerImage ?? null,
    format: raw.format ?? null,
    seasonYear: raw.seasonYear ?? null,
    status: raw.status ?? null,
    episodes: raw.episodes ?? null,
    nextAiringEpisode: pickNextAiring(raw.nextAiringEpisode),
    averageScore: raw.averageScore ?? null,
    genres: raw.genres || [],
    description: raw.description ?? '',
  };
}

/** Full detail shape used by /api/anime/:id. */
export function toMedia(raw) {
  if (!raw) return null;
  return {
    ...toCard(raw),
    meanScore: raw.meanScore ?? null,
    popularity: raw.popularity ?? null,
    favourites: raw.favourites ?? null,
    duration: raw.duration ?? null,
    season: raw.season ?? null,
    source: raw.source ?? null,
    startDate: raw.startDate || { year: null, month: null, day: null },
    endDate: raw.endDate || { year: null, month: null, day: null },
    studios: { nodes: (raw.studios?.nodes || []).map((s) => ({ name: s.name })) },
    trailer: raw.trailer ? { id: raw.trailer.id, site: raw.trailer.site, thumbnail: raw.trailer.thumbnail ?? null } : null,
    tags: (raw.tags || []).map((t) => ({ name: t.name, rank: t.rank ?? null })),
    characters: {
      edges: (raw.characters?.edges || []).map((e) => ({
        role: e.role,
        node: {
          id: e.node?.id,
          name: { full: e.node?.name?.full ?? '' },
          image: { medium: e.node?.image?.medium ?? null },
        },
        voiceActors: (e.voiceActors || []).map((va) => ({
          id: va.id,
          name: { full: va.name?.full ?? '' },
          language: va.language || 'Japanese',
        })),
      })),
    },
    relations: {
      edges: (raw.relations?.edges || [])
        .filter((e) => e.node?.type === 'ANIME')
        .map((e) => ({
          relationType: e.relationType,
          node: {
            id: e.node.id,
            type: e.node.type,
            title: { romaji: e.node.title?.romaji ?? null },
            coverImage: { large: e.node.coverImage?.large ?? null },
            format: e.node.format ?? null,
            episodes: e.node.episodes ?? null,
            status: e.node.status ?? null,
          },
        })),
    },
    recommendations: {
      nodes: (raw.recommendations?.nodes || [])
        .map((n) => n.mediaRecommendation)
        .filter(Boolean)
        .map((m) => toCard(m)),
    },
    externalLinks: (raw.externalLinks || []).map((l) => ({ id: l.id, site: l.site, url: l.url, type: l.type })),
  };
}

/** Shape used by /api/schedule items (schedule slot + media summary). */
export function toScheduleItem(raw) {
  const media = raw.media;
  return {
    id: media?.id ?? raw.id,
    airingAt: raw.airingAt,
    episode: raw.episode,
    media: {
      id: media?.id,
      title: pickTitle(media?.title),
      coverImage: pickCover(media?.coverImage),
      format: media?.format ?? null,
      episodes: media?.episodes ?? null,
      nextAiringEpisode: pickNextAiring(media?.nextAiringEpisode),
    },
  };
}

/** Lightweight object used by search suggestions. */
export function toSuggestion(raw) {
  return {
    id: raw.id,
    title: pickTitle(raw.title),
    coverImage: pickCover(raw.coverImage),
    format: raw.format ?? null,
    seasonYear: raw.seasonYear ?? null,
    averageScore: raw.averageScore ?? null,
  };
}

export function toPageInfo(page) {
  return {
    total: page.pageInfo?.total ?? 0,
    currentPage: page.pageInfo?.currentPage ?? 1,
    lastPage: page.pageInfo?.lastPage ?? 1,
    hasNextPage: Boolean(page.pageInfo?.hasNextPage),
    perPage: page.pageInfo?.perPage ?? 0,
  };
}
