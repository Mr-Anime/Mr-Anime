import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import type { Media } from "@/lib/anilist/types";
import { AnimeCard } from "./anime-card";

export function AnimeRow({
  title,
  items,
  href,
  viewAllLabel = "View all",
}: {
  title: string;
  items: Media[];
  href?: string;
  viewAllLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        <p className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
          Nothing here right now — check back soon.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3" aria-label={title}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {viewAllLabel}
            <ChevronRightIcon className="size-4" />
          </Link>
        ) : null}
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0">
        {items.map((media, index) => (
          <AnimeCard
            key={media.id}
            media={media}
            priority={index < 6}
            className="w-36 shrink-0 sm:w-40"
          />
        ))}
      </div>
    </section>
  );
}
