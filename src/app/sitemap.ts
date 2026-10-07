import type { MetadataRoute } from "next";
import { getTrending } from "@/lib/anilist/anime";
import { siteConfig } from "@/lib/config";

const LAST_BUILD = new Date();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: LAST_BUILD,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/search`,
      lastModified: LAST_BUILD,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: LAST_BUILD,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteConfig.url}/dmca`,
      lastModified: LAST_BUILD,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  let trendingRoutes: MetadataRoute.Sitemap = [];
  try {
    const { items } = await getTrending(1, 50);
    trendingRoutes = items
      .filter((media) => !media.isAdult)
      .map((media) => ({
        url: `${siteConfig.url}/anime/${media.id}`,
        lastModified: LAST_BUILD,
        changeFrequency: "weekly",
        priority: 0.7,
      }));
  } catch (error) {
    // AniList unavailable at build time — ship static routes only.
    console.warn("sitemap: trending fetch failed", error);
  }

  return [...staticRoutes, ...trendingRoutes];
}
