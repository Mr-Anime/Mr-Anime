import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "lucide-react";
import type { Media } from "@/lib/anilist/types";
import { mediaTitle } from "@/lib/anime-format";
import { cn } from "cn";

type Props = {
  media: Media;
  priority?: boolean;
  className?: string;
};

export function AnimeCard({ media, priority = false, className }: Props) {
  const title = mediaTitle(media);
  const image = media.coverImage?.extraLarge || media.coverImage?.large;
  const score =
    typeof media.averageScore === "number" && media.averageScore > 0
      ? (media.averageScore / 10).toFixed(1)
      : null;

  return (
    <Link
      href={`/anime/${media.id}`}
      className={cn(
        "group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={title}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border/60 bg-muted transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-black/40">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 36vw, 160px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
            {title}
          </div>
        )}

        {score ? (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400 backdrop-blur-sm">
            <StarIcon className="size-3 fill-current" />
            {score}
          </span>
        ) : null}

        {media.status === "RELEASING" ? (
          <span className="absolute right-1.5 bottom-1.5 rounded bg-red-600/90 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
            AIRING
          </span>
        ) : null}
      </div>

      <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-sky-400">
        {title}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {[media.format, media.episodes ? `${media.episodes} eps` : null, media.seasonYear]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </Link>
  );
}
