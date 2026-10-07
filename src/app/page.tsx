import type { Metadata } from "next";
import { AnimeRow } from "@/components/anime/anime-row";
import { GenreChips } from "@/components/anime/genre-chips";
import { HeroBanner } from "@/components/anime/hero-banner";
import { RowSkeleton } from "@/components/anime/media-skeletons";
import {
  getPopular,
  getSeasonal,
  getTopRated,
  getTrending,
} from "@/lib/anilist/anime";
import { currentSeason, currentSeasonYear } from "@/lib/anime-format";
import type { PageResult } from "@/lib/anilist/types";
import { siteConfig } from "@/lib/config";
import { stripHtml } from "@/lib/sanitize";
import { Suspense } from "react";

// Live AniList data (POST fetches can't use the static data cache) — rendered
// per request, served from the in-memory TTL cache after the first hit.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${siteConfig.name} — Watch Anime Online`,
  description: siteConfig.description,
};

async function safeFetch(fn: () => Promise<PageResult>): Promise<PageResult | null> {
  try {
    return await fn();
  } catch (error) {
    console.error("home data fetch failed", error);
    return null;
  }
}

function firstTrending(): Promise<PageResult | null> {
  return safeFetch(() => getTrending(1, 20));
}

async function Hero() {
  const data = await firstTrending();
  const hero = data?.items[0];
  if (!hero) {
    return (
      <div className="mx-auto -mx-4 mb-10 flex h-[40vh] min-h-[280px] w-[calc(100%+2rem)] items-center justify-center border-b border-border/60 px-4 text-sm text-muted-foreground sm:mx-0 sm:w-full">
        Trending data is unavailable right now. Please try again later.
      </div>
    );
  }
  return <HeroBanner media={hero} />;
}

async function TrendingRow() {
  const data = await firstTrending();
  return (
    <AnimeRow
      title="Trending now"
      items={data?.items.slice(1) ?? []}
      href="/search?sort=TRENDING_DESC"
    />
  );
}

async function SeasonalRow() {
  const data = await safeFetch(() =>
    getSeasonal(currentSeason(), currentSeasonYear(), 1, 24),
  );
  return (
    <AnimeRow
      title={`Popular this ${currentSeason()}`}
      items={data?.items ?? []}
      href={`/search?season=${currentSeason()}&year=${currentSeasonYear()}&sort=POPULARITY_DESC`}
    />
  );
}

async function TopRatedRow() {
  const data = await safeFetch(() => getTopRated(1, 24));
  return <AnimeRow title="Top rated of all time" items={data?.items ?? []} href="/search?sort=SCORE_DESC" />;
}

async function PopularRow() {
  const data = await safeFetch(() => getPopular(1, 24));
  return <AnimeRow title="All-time popular" items={data?.items ?? []} href="/search?sort=POPULARITY_DESC" />;
}

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: stripHtml(siteConfig.description),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-6 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Suspense fallback={<div className="h-[58vh] min-h-[400px] w-full bg-muted/30" />}>
        <Hero />
      </Suspense>

      <Suspense fallback={<RowSkeleton />}>
        <TrendingRow />
      </Suspense>

      <Suspense fallback={<RowSkeleton />}>
        <SeasonalRow />
      </Suspense>

      <Suspense fallback={<RowSkeleton />}>
        <TopRatedRow />
      </Suspense>

      <Suspense fallback={<RowSkeleton />}>
        <PopularRow />
      </Suspense>

      <GenreChips />
    </div>
  );
}
