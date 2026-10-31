import type { APIRoute } from "astro";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const query = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      description
      coverImage { large extraLarge }
      bannerImage
      averageScore
      episodes
      status
      season
      seasonYear
      genres
      duration
      studios { nodes { name } }
    }
  }
`;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const id = Number(params.id);
    const env = (locals as any).runtime?.env;
    const cache = env?.CACHE;
    const key = "anilist:media:" + id + ":v1";
    if (cache) {
      const cached = await cache.get(key, "json");
      if (cached) return new Response(JSON.stringify(cached), { headers: { "Content-Type": "application/json" } });
    }
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mr.Anime/1.0" },
      body: JSON.stringify({ query, variables: { id } })
    });
    const json = await res.json();
    const data = (json as any)?.data?.Media || null;
    if (cache && data) {
      await cache.put(key, JSON.stringify(data), { expirationTtl: 21600 });
    }
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const config = { runtime: "edge" };