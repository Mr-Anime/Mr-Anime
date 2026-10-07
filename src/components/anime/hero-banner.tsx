import Image from "next/image";
import Link from "next/link";
import { InfoIcon, PlayIcon } from "lucide-react";
import type { Media } from "@/lib/anilist/types";
import { mediaTitle } from "@/lib/anime-format";
import { stripHtml } from "@/lib/sanitize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroBanner({ media }: { media: Media }) {
  const title = mediaTitle(media);
  const banner = media.bannerImage || media.coverImage?.extraLarge || media.coverImage?.large;
  const description = stripHtml(media.description).slice(0, 320);
  const firstEpisode = 1;
  const canWatch = Boolean(media.episodes && media.episodes > 0);

  return (
    <section
      className="relative -mx-4 mb-10 h-[58vh] min-h-[400px] w-[calc(100%+2rem)] overflow-hidden sm:mx-0 sm:w-full"
      aria-label={`Featured: ${title}`}
    >
      {banner ? (
        <Image
          src={banner}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
      ) : null}

      {/* cinematic gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      <div className="absolute right-0 bottom-0 left-0">
        <div className="mx-auto w-full max-w-7xl space-y-4 px-4 pb-8 sm:pb-12">
          <div className="flex flex-wrap items-center gap-2">
            {media.format ? <Badge variant="secondary">{media.format}</Badge> : null}
            {media.seasonYear ? (
              <Badge variant="outline">
                {media.season ? `${media.season.charAt(0) + media.season.slice(1).toLowerCase()} ` : ""}
                {media.seasonYear}
              </Badge>
            ) : null}
            {media.averageScore ? (
              <Badge variant="outline" className="text-emerald-400">
                ★ {(media.averageScore / 10).toFixed(1)}
              </Badge>
            ) : null}
          </div>

          <h1 className="max-w-3xl text-3xl font-bold text-balance tracking-tight sm:text-5xl">
            <Link href={`/anime/${media.id}`} className="transition-colors hover:text-sky-400">
              {title}
            </Link>
          </h1>

          {description ? (
            <p className="max-w-2xl line-clamp-3 text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {canWatch ? (
              <Button render={<Link href={`/watch/${media.id}/${firstEpisode}`} />} size="lg">
                <PlayIcon />
                Watch episode 1
              </Button>
            ) : null}
            <Button
              render={<Link href={`/anime/${media.id}`} />}
              size="lg"
              variant="outline"
            >
              <InfoIcon />
              Details
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
