import type { APIRoute } from 'astro';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

const trendingQuery = \
  query {
    Page(page: 1, perPage: 20) {
      media(type: ANIME, sort: TRENDING_DESC) {
        id
        title { romaji english native }
        coverImage { large medium }
        bannerImage
        averageScore
        episodes
        seasonYear
        genres
      }
    }
  }
\;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const cache = env?.CACHE;
    const key = 'anilist:trending:v1';
    if (cache) {
      const cached = await cache.get(key, 'json');
      if (cached) return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } });
    }
    const res = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mr.Anime/1.0' },
      body: JSON.stringify({ query: trendingQuery })
    });
    const json = await res.json();
    const data = (json as any)?.data?.Page?.media || [];
    if (cache) {
      await cache.put(key, JSON.stringify(data), { expirationTtl: 3600 });
    }
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const config = { runtime: 'edge' };
