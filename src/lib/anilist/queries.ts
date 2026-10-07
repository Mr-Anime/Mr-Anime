const CORE_MEDIA_FIELDS = `
  id
  type
  status
  format
  episodes
  duration
  season
  seasonYear
  averageScore
  popularity
  genres
  description(asHtml: false)
  bannerImage
  isAdult
  coverImage { extraLarge large color }
  title { romaji english native }
  startDate { year month day }
  endDate { year month day }
  studios(isMain: true) { nodes { id name } }
  nextAiringEpisode { episode airingAt }
  trailer { id site }
`;

/** Paged list query — trending / popular / seasonal / top / search. */
export const PAGE_MEDIA_QUERY = `
query (
  $page: Int
  $perPage: Int
  $sort: [MediaSort]
  $type: MediaType
  $season: MediaSeason
  $seasonYear: Int
  $genre: String
  $status: MediaStatus
  $format: MediaFormat
  $search: String
) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage total }
    media(
      type: $type
      sort: $sort
      season: $season
      seasonYear: $seasonYear
      genre: $genre
      status: $status
      format: $format
      search: $search
      isAdult: false
    ) {
      ${CORE_MEDIA_FIELDS}
    }
  }
}
`;

/** Full details for /anime/[id]. */
export const MEDIA_DETAILS_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    ${CORE_MEDIA_FIELDS}
    meanScore
    favourites
    source
    countryOfOrigin
    synonyms
    hashtag
    characters(sort: [ROLE, RELEVANCE], perPage: 26) {
      edges {
        role
        node { id name { full native } image { large medium } }
        voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
          id name { full } image { large }
        }
      }
    }
    staff(perPage: 8, sort: [RELEVANCE]) {
      edges { role node { id name { full } } }
    }
    relations {
      edges {
        relationType
        node {
          id type format status
          title { romaji english }
          bannerImage
          coverImage { extraLarge large color }
          episodes averageScore
        }
      }
    }
    recommendations(perPage: 12, sort: [RATING_DESC]) {
      nodes {
        mediaRecommendation {
          id type format status
          title { romaji english }
          bannerImage
          coverImage { extraLarge large color }
          episodes averageScore
        }
      }
    }
    streamingEpisodes { site title thumbnail }
    externalLinks { id site url }
  }
}
`;
