import Link from "next/link";
import { ANIME_GENRES } from "@/lib/anime-format";

export function GenreChips() {
  return (
    <section className="space-y-3" aria-label="Browse by genre">
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Browse by genre</h2>
      <div className="flex flex-wrap gap-2">
        {ANIME_GENRES.map((genre) => (
          <Link
            key={genre}
            href={`/search?genre=${encodeURIComponent(genre)}`}
            className="rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-sky-500/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {genre}
          </Link>
        ))}
      </div>
    </section>
  );
}
