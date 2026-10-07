import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PlayIcon, TvIcon } from "lucide-react";
import { buildUrl, getProviders } from "@/config/providers";
import { EpisodeGrid } from "@/components/anime/episode-grid";
import { PlayerHost } from "@/components/watch/player-host";
import { Badge } from "@/components/ui/badge";
import { getAnimeDetails } from "@/lib/anilist/anime";
import type { Media } from "@/lib/anilist/types";
import { mediaTitle } from "@/lib/anime-format";
import { siteConfig } from "@/lib/config";
import {
  getTmdbSeason,
  isTmdbConfigured,
  matchTmdbForTitle,
  type TmdbEpisode,
} from "@/lib/tmdb/client";

type PageProps = {
  params: Promise<{ id: string; episode: string }>;
  searchParams: Promise<{ s?: string | string[] }>;
};

async function resolveWatch(
  idParam: string,
  episodeParam: string,
): Promise<{ media: Media | null; episode: number }> {
  if (!/^\d+$/.test(idParam) || !/^\d+$/.test(episodeParam)) {
    return { media: null, episode: 0 };
  }
  const episode = Number(episodeParam);
  if (episode < 1 || episode > 10000) return { media: null, episode };

  let media: Media | null = null;
  try {
    media = await getAnimeDetails(Number(idParam));
  } catch (error) {
    console.error("watch: details failed", error);
    return { media: null, episode };
  }
  if (!media) return { media: null, episode };
  if (media.episodes && episode > media.episodes) return { media: null, episode };
  return { media, episode };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, episode } = await params;
  const { media, episode: ep } = await resolveWatch(id, episode);
  if (!media) return { title: "Episode not found" };
  const title = mediaTitle(media);
  return {
    title: `${title} — Episode ${ep}`,
    description: `Watch ${title} episode ${ep} on ${siteConfig.name}.`,
    robots: { index: false },
  };
}

export default async function WatchPage({ params, searchParams }: PageProps) {
  const { id, episode: episodeParam } = await params;
  const sp = await searchParams;
  const { media, episode } = await resolveWatch(id, episodeParam);
  if (!media) notFound();

  const title = mediaTitle(media);
  const total = media.episodes ?? 0;

  // TMDB season (default 1) — lets later cours use ?s=2…
  const rawSeason = Array.isArray(sp.s) ? sp.s[0] : sp.s;
  const seasonN = rawSeason && /^\d+$/.test(rawSeason) ? Number(rawSeason) : 1;

  let tmdbId: number | null = null;
  let tmdbEp: TmdbEpisode | null = null;
  if (isTmdbConfigured()) {
    try {
      const match = await matchTmdbForTitle(title, media.seasonYear);
      if (match) {
        tmdbId = match.id;
        const season = await getTmdbSeason(match.id, seasonN);
        tmdbEp = season.episodes.find((e) => e.episode_number === episode) ?? null;
      }
    } catch (error) {
      console.warn("watch: TMDB enrichment skipped", error);
    }
  }

  const streamingList = media.streamingEpisodes ?? [];
  const completeStreamingList =
    media.episodes !== null &&
    media.episodes !== undefined &&
    streamingList.length >= media.episodes;

  let episodeTitle: string | null = tmdbEp?.name ?? null;
  let episodeThumb: string | null = tmdbEp?.still_path
    ? `https://image.tmdb.org/t/p/w780${tmdbEp.still_path}`
    : null;
  if (completeStreamingList && streamingList[episode - 1]) {
    episodeTitle ??= streamingList[episode - 1].title ?? null;
    episodeThumb ??= streamingList[episode - 1].thumbnail ?? null;
  }

  const providers = getProviders().map((p) => ({
    id: p.id,
    name: p.name,
    url: buildUrl(p, { mediaId: media.id, episode, title, tmdbId, season: seasonN }),
  }));

  const thumbs: Record<number, string> = {};
  if (completeStreamingList) {
    streamingList.slice(0, total).forEach((se, i) => {
      if (se.thumbnail) thumbs[i + 1] = se.thumbnail;
    });
  }
  if (episodeThumb && !thumbs[episode]) thumbs[episode] = episodeThumb;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TVEpisode",
            name: `${title} — Episode ${episode}`,
            url: `${siteConfig.url}/watch/${media.id}/${episode}`,
            episodeNumber: episode,
            isPartOf: {
              "@type": "TVSeries",
              name: title,
              url: `${siteConfig.url}/anime/${media.id}`,
            },
          }),
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            href={`/anime/${media.id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            {title}
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            Episode {episode}
            <Badge variant="secondary" className="gap-1">
              <TvIcon className="size-3" />
              {media.format ?? "Anime"}
            </Badge>
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/search?q=${encodeURIComponent(title)}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Find similar
          </Link>
        </div>
      </div>

      <PlayerHost
        providers={providers}
        mediaId={media.id}
        episode={episode}
        title={title}
        episodeTitle={episodeTitle}
        totalEpisodes={total}
      />

      <section className="space-y-4" aria-label="Episodes">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <PlayIcon className="size-4 text-sky-500" />
          Episodes
          {total ? <span className="text-sm font-normal text-muted-foreground">({total})</span> : null}
        </h2>
        <EpisodeGrid mediaId={media.id} total={total} thumbnails={thumbs} />
      </section>
    </div>
  );
}
