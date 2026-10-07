"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  mediaId: number;
  total: number;
  /** episode number → thumbnail (from AniList streamingEpisodes) */
  thumbnails?: Record<number, string>;
  /** AniList/TMDB episode titles, when available */
  titles?: Record<number, string>;
};

const PAGE_SIZE = 48;

export function EpisodeGrid({ mediaId, total, thumbnails, titles }: Props) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (total <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Episode count is not known yet — you can still open the player.
      </p>
    );
  }

  const shown = Array.from({ length: Math.min(visible, total) }, (_, i) => i + 1);
  const remaining = total - shown.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {shown.map((ep) => {
          const thumb = thumbnails?.[ep];
          const title = titles?.[ep];
          return (
            <Link
              key={ep}
              href={`/watch/${mediaId}/${ep}`}
              className="group overflow-hidden rounded-lg border border-border/60 bg-card transition-colors hover:border-sky-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Watch episode ${ep}${title ? `: ${title}` : ""}`}
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <PlayIcon className="size-6" />
                  </div>
                )}
                <span className="absolute right-1.5 bottom-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold">
                  EP {ep}
                </span>
              </div>
              <p className="line-clamp-1 px-2 py-1.5 text-xs">
                {title ?? `Episode ${ep}`}
              </p>
            </Link>
          );
        })}
      </div>

      {remaining > 0 ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setVisible((v) => v + 96)}>
            Show {Math.min(96, remaining)} more ({remaining} left)
          </Button>
        </div>
      ) : null}
    </div>
  );
}
