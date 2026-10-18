import Image from "next/image";
import Link from "next/link";
import { PlayIcon } from "lucide-react";
import { getMediaByIds } from "@/lib/anilist/anime";
import { mediaTitle } from "@/lib/anime-format";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCommentViewer } from "@/lib/comments";

/** "Continue Watching" row for the home page (signed-in viewers only). */
export async function ContinueWatchingRow() {
  const viewer = await getCommentViewer();
  if (!viewer) return null;

  let rows: { anilist_id: number; episode: number }[] = [];
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("watch_progress")
      .select("anilist_id, episode")
      .eq("user_id", viewer.id)
      .order("updated_at", { ascending: false })
      .limit(24);
    if (error) throw error;
    rows = (data ?? []) as { anilist_id: number; episode: number }[];
  } catch {
    return null;
  }
  if (rows.length === 0) return null;

  // Newest entry per anime, max 8 cards.
  const seen = new Set<number>();
  const picks: { anilistId: number; episode: number }[] = [];
  for (const row of rows) {
    if (seen.has(row.anilist_id)) continue;
    seen.add(row.anilist_id);
    picks.push({ anilistId: row.anilist_id, episode: row.episode });
    if (picks.length >= 8) break;
  }

  let media;
  try {
    media = await getMediaByIds(picks.map((p) => p.anilistId));
  } catch {
    return null;
  }
  const byId = new Map(media.map((m) => [m.id, m]));

  const items = picks
    .map((pick) => ({ pick, media: byId.get(pick.anilistId) }))
    .filter((x): x is { pick: typeof x.pick; media: NonNullable<typeof x.media> } => Boolean(x.media));
  if (items.length === 0) return null;

  return (
    <section aria-label="Continue watching" className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
        Continue watching
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {items.map(({ pick, media }) => {
          const title = mediaTitle(media);
          const image = media.coverImage?.extraLarge || media.coverImage?.large;
          return (
            <Link
              key={pick.anilistId}
              href={`/watch/${pick.anilistId}/${pick.episode}`}
              className="group w-36 shrink-0 sm:w-40"
              aria-label={`${title} episode ${pick.episode}`}
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border/60 bg-muted transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-black/40">
                {image ? (
                  <Image
                    src={image}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 36vw, 160px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                    {title}
                  </div>
                )}
                <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-sky-400 backdrop-blur-sm">
                  <PlayIcon className="size-3 fill-current" />
                  EP {pick.episode}
                </span>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
                  <div
                    className="h-full bg-sky-500"
                    style={{
                      width: `${media.episodes ? Math.min(100, (pick.episode / media.episodes) * 100) : 8}%`,
                    }}
                  />
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-sky-400">
                {title}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
