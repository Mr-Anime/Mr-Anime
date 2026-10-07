import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarIcon,
  ClapperboardIcon,
  ClockIcon,
  PlayIcon,
  StarIcon,
} from "lucide-react";
import { AnimeCard } from "@/components/anime/anime-card";
import { EpisodeGrid } from "@/components/anime/episode-grid";
import { TrailerDialog } from "@/components/anime/trailer-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getAnimeDetails } from "@/lib/anilist/anime";
import type { Media } from "@/lib/anilist/types";
import { ANIME_GENRES, mediaTitle, SEASON_LABELS } from "@/lib/anime-format";
import { siteConfig } from "@/lib/config";
import { sanitizeRichText, stripHtml } from "@/lib/sanitize";
import { isTmdbConfigured, getTmdbVideos, matchTmdbForTitle } from "@/lib/tmdb/client";

type Params = { params: Promise<{ id: string }> };

const STATUS_LABELS: Record<string, string> = {
  RELEASING: "Airing",
  FINISHED: "Finished",
  NOT_YET_RELEASED: "Upcoming",
  CANCELLED: "Cancelled",
  HIATUS: "On hiatus",
};

async function fetchMedia(idParam: string): Promise<Media | null> {
  if (!/^\d+$/.test(idParam)) return null;
  try {
    return await getAnimeDetails(Number(idParam));
  } catch (error) {
    console.error("anime details failed", error);
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const media = await fetchMedia(id);
  if (!media) return { title: "Anime not found" };

  const title = mediaTitle(media);
  const description = stripHtml(media.description).slice(0, 170);
  const image = media.bannerImage || media.coverImage?.extraLarge || undefined;
  const url = `${siteConfig.url}/anime/${media.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} · ${siteConfig.name}`,
      description,
      url,
      type: "video.tv_show",
      siteName: siteConfig.name,
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${siteConfig.name}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function formatDate(d?: { year?: number | null; month?: number | null; day?: number | null }) {
  if (!d?.year) return null;
  return new Date(d.year, (d.month ?? 1) - 1, d.day ?? 1).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 text-sm">
      <span className="mt-0.5 text-muted-foreground" aria-hidden>
        {icon}
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{children}</p>
      </div>
    </div>
  );
}

export default async function AnimeDetailsPage({ params }: Params) {
  const { id } = await params;
  const media = await fetchMedia(id);
  if (!media) notFound();

  const title = mediaTitle(media);
  const descriptionHtml = sanitizeRichText(media.description);
  const plainDescription = stripHtml(media.description);
  const score = typeof media.averageScore === "number" && media.averageScore > 0
    ? (media.averageScore / 10).toFixed(1)
    : null;

  // Trailer: AniList first, TMDB fallback
  let youtubeId =
    media.trailer?.site?.toLowerCase() === "youtube" && media.trailer.id
      ? media.trailer.id
      : null;

  if (!youtubeId && isTmdbConfigured()) {
    try {
      const tmdbTv = await matchTmdbForTitle(title, media.seasonYear);
      if (tmdbTv) {
        const videos = await getTmdbVideos(tmdbTv.id);
        youtubeId =
          videos.find(
            (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"),
          )?.key ?? null;
      }
    } catch {
      // TMDB is optional — trailer simply stays unavailable
    }
  }

  const episodeThumbs: Record<number, string> = {};
  const episodeTitles: Record<number, string> = {};
  // MediaStreamingEpisode has no episode number — only index-map a complete list.
  const streamingList = media.streamingEpisodes ?? [];
  if (media.episodes && streamingList.length >= media.episodes) {
    streamingList.slice(0, media.episodes).forEach((se, i) => {
      if (se.thumbnail) episodeThumbs[i + 1] = se.thumbnail;
      if (se.title) episodeTitles[i + 1] = se.title;
    });
  }

  const characters = media.characters?.edges?.slice(0, 14) ?? [];
  const relations =
    media.relations?.edges?.filter((e) => e.node.type === "ANIME").slice(0, 12) ?? [];
  const recommendations =
    media.recommendations?.nodes
      ?.map((n) => n.mediaRecommendation)
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .slice(0, 12) ?? [];

  const airedFrom = formatDate(media.startDate);
  const airedTo = formatDate(media.endDate);
  const studios = media.studios?.nodes?.map((s) => s.name) ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: title,
    alternateName: media.title?.romaji ?? undefined,
    description: plainDescription || undefined,
    url: `${siteConfig.url}/anime/${media.id}`,
    image: media.coverImage?.extraLarge ?? undefined,
    genre: media.genres,
    numberOfEpisodes: media.episodes ?? undefined,
    datePublished: media.startDate?.year
      ? `${media.startDate.year}-${String(media.startDate.month ?? 1).padStart(2, "0")}-${String(media.startDate.day ?? 1).padStart(2, "0")}`
      : undefined,
    productionCompany: studios.length ? studios : undefined,
    aggregateRating:
      score && media.meanScore
        ? {
            "@type": "AggregateRating",
            ratingValue: (media.meanScore / 10).toFixed(1),
            bestRating: "10",
            worstRating: "1",
          }
        : undefined,
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Banner */}
      <header className="relative -mx-4 mb-8 overflow-hidden">
        <div className="absolute inset-0">
          {media.bannerImage ? (
            <Image
              src={media.bannerImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
        </div>

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-16 pb-8 sm:flex-row sm:pt-24">
          <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted shadow-xl sm:w-52">
            {(() => {
              const cover = media.coverImage?.extraLarge || media.coverImage?.large;
              return cover ? (
                <Image
                  src={cover}
                  alt={title}
                  fill
                  priority
                  sizes="208px"
                  className="object-cover"
                />
              ) : null;
            })()}
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              {media.format ? <Badge variant="secondary">{media.format}</Badge> : null}
              {media.status ? (
                <Badge variant="outline">{STATUS_LABELS[media.status] ?? media.status}</Badge>
              ) : null}
              {media.season && media.seasonYear ? (
                <Badge variant="outline">
                  {SEASON_LABELS[media.season] ?? media.season} {media.seasonYear}
                </Badge>
              ) : null}
              {score ? (
                <Badge variant="outline" className="gap-1 text-emerald-400">
                  <StarIcon className="size-3 fill-current" />
                  {score}
                </Badge>
              ) : null}
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            {media.title?.romaji && media.title.romaji !== title ? (
              <p className="text-sm text-muted-foreground">{media.title.romaji}</p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button render={<Link href={`/watch/${media.id}/1`} />} size="lg">
                <PlayIcon />
                Watch now
              </Button>
              {youtubeId ? <TrailerDialog youtubeId={youtubeId} title={title} /> : null}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-10 pb-16 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          {/* Synopsis */}
          <section aria-label="Synopsis" className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">Synopsis</h2>
            {descriptionHtml ? (
              <div
                className="text-sm leading-relaxed text-muted-foreground [&_a]:text-sky-400 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No synopsis available.</p>
            )}
          </section>

          {/* Episodes */}
          <section aria-label="Episodes" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Episodes</h2>
              <span className="text-sm text-muted-foreground">
                {media.episodes ? `${media.episodes} episodes` : "TBA"}
              </span>
            </div>
            <EpisodeGrid
              mediaId={media.id}
              total={media.episodes ?? 0}
              thumbnails={episodeThumbs}
              titles={episodeTitles}
            />
          </section>

          {/* Characters */}
          {characters.length > 0 ? (
            <section aria-label="Characters" className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">Characters</h2>
              <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none">
                {characters.map((edge) => (
                  <div key={edge.node.id} className="w-28 shrink-0 text-center">
                    <div className="relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-muted">
                      {edge.node.image?.large ? (
                        <Image
                          src={edge.node.image.large}
                          alt={edge.node.name.full ?? ""}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-medium">
                      {edge.node.name.full}
                    </p>
                    {edge.voiceActors?.[0] ? (
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                        {edge.voiceActors[0].name.full}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Relations */}
          {relations.length > 0 ? (
            <section aria-label="Related anime" className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">Related anime</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {relations.map((edge) => (
                  <div key={`${edge.relationType}-${edge.node.id}`} className="space-y-1">
                    <AnimeCard media={edge.node} />
                    <p className="text-[11px] tracking-wide text-sky-500 uppercase">
                      {edge.relationType?.replace(/_/g, " ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Recommendations */}
          {recommendations.length > 0 ? (
            <section aria-label="Recommendations" className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">You might also like</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {recommendations.map((rec) => (
                  <AnimeCard key={rec.id} media={rec} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Details
            </h2>
            <div className="divide-y divide-border/60">
              <InfoRow icon={<ClapperboardIcon className="size-4" />} label="Studio">
                {studios.length ? studios.join(", ") : "Unknown"}
              </InfoRow>
              <InfoRow icon={<PlayIcon className="size-4" />} label="Episodes">
                {media.episodes ?? "TBA"}
              </InfoRow>
              <InfoRow icon={<ClockIcon className="size-4" />} label="Duration">
                {media.duration ? `${media.duration} min / ep` : "Unknown"}
              </InfoRow>
              <InfoRow icon={<CalendarIcon className="size-4" />} label="Aired">
                {airedFrom ? `${airedFrom}${airedTo ? ` → ${airedTo}` : ""}` : "Unknown"}
              </InfoRow>
              {media.source ? (
                <InfoRow icon={<span className="text-xs font-mono">SRC</span>} label="Source">
                  {media.source.replace(/_/g, " ")}
                </InfoRow>
              ) : null}
              {media.meanScore ? (
                <InfoRow icon={<StarIcon className="size-4" />} label="Score">
                  {(media.meanScore / 10).toFixed(1)} / 10
                </InfoRow>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Genres
            </h2>
            <div className="flex flex-wrap gap-2">
              {(media.genres?.length ? media.genres : ANIME_GENRES.slice(0, 4)).map((g) => (
                <Link
                  key={g}
                  href={`/search?genre=${encodeURIComponent(g)}`}
                  className="rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-sky-500/60 hover:text-foreground"
                >
                  {g}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
            <p>
              Metadata provided by AniList. Episode stills and trailers enriched with
              TMDB where available.
            </p>
          </div>
        </aside>
      </div>
      <Separator className="mb-0" />
    </div>
  );
}
