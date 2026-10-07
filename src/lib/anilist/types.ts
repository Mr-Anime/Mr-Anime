export type MediaCover = {
  extraLarge?: string | null;
  large?: string | null;
  color?: string | null;
};

export type MediaTitle = {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
};

export type MediaCharacter = {
  role?: string;
  node: {
    id: number;
    name: { full?: string; native?: string };
    image?: { large?: string; medium?: string };
  };
  voiceActors?: {
    id: number;
    name: { full?: string };
    image?: { large?: string };
  }[];
};

export type MediaRelationNode = {
  id: number;
  type?: string;
  format?: string;
  status?: string;
  title: MediaTitle;
  bannerImage?: string | null;
  coverImage?: MediaCover;
  episodes?: number | null;
  averageScore?: number | null;
};

export type Media = {
  id: number;
  type?: string;
  status?: string | null;
  format?: string | null;
  episodes?: number | null;
  duration?: number | null;
  season?: string | null;
  seasonYear?: number | null;
  averageScore?: number | null;
  meanScore?: number | null;
  popularity?: number | null;
  favourites?: number | null;
  genres?: string[];
  description?: string | null;
  bannerImage?: string | null;
  coverImage?: MediaCover;
  title?: MediaTitle;
  startDate?: { year?: number | null; month?: number | null; day?: number | null };
  endDate?: { year?: number | null; month?: number | null; day?: number | null };
  studios?: { nodes?: { id?: number; name: string }[] };
  nextAiringEpisode?: { episode: number; airingAt: number } | null;
  trailer?: { id?: string | null; site?: string | null } | null;
  isAdult?: boolean;
  source?: string;
  countryOfOrigin?: string;
  synonyms?: string[];
  hashtag?: string | null;
  characters?: { edges?: MediaCharacter[] };
  staff?: { edges?: { role?: string; node: { id: number; name: { full?: string } } }[] };
  relations?: { edges?: { relationType?: string; node: MediaRelationNode }[] };
  recommendations?: {
    nodes?: { mediaRecommendation: MediaRelationNode | null }[];
  };
  streamingEpisodes?: {
    site?: string;
    title?: string;
    thumbnail?: string;
  }[];
  externalLinks?: { id?: number; site?: string; url?: string }[];
};

export type PageInfo = {
  currentPage: number;
  hasNextPage: boolean;
  total?: number | null;
};

export type PageResult = {
  items: Media[];
  pageInfo: PageInfo;
};
