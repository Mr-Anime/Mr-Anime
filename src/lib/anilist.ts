const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export interface Anime {
  id: number;
  title: { english: string | null; romaji: string };
  description: string | null;
  coverImage: { extraLarge: string; large: string };
  bannerImage: string | null;
  episodes: number | null;
  seasonYear: number | null;
  genres: string[];
  averageScore: number | null;
}

const query = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { english romaji }
      description(asHtml: false)
      coverImage { extraLarge large }
      bannerImage
      episodes
      seasonYear
      genres
      averageScore
    }
  }
`;

export async function getAnime(id: number): Promise<Anime | null> {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query, variables: { id } }),
  });

  if (!response.ok) {
    throw new Error(`AniList request failed with status ${response.status}`);
  }

  const result = await response.json() as { data?: { Media?: Anime | null } };
  return result.data?.Media ?? null;
}
