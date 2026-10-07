import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListManager } from "@/components/list/list-manager";
import { getMediaByIds } from "@/lib/anilist/anime";
import { mediaTitle } from "@/lib/anime-format";
import { siteConfig } from "@/lib/config";
import { getListEntries } from "@/lib/list";
import type { ListItem } from "@/lib/list-shared";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My List",
  description: `Track the anime you are watching on ${siteConfig.name}.`,
  robots: { index: false },
};

export default async function MyListPage() {
  const entries = await getListEntries();
  if (!entries) redirect("/login?next=/list");

  let media: Awaited<ReturnType<typeof getMediaByIds>> = [];
  if (entries.length > 0) {
    try {
      media = await getMediaByIds(entries.map((e) => e.anilist_id));
    } catch (error) {
      console.error("list: media lookup failed", error);
    }
  }
  const byId = new Map(media.map((m) => [m.id, m]));

  const items: ListItem[] = entries.map((entry) => {
    const m = byId.get(entry.anilist_id) ?? null;
    const score =
      typeof m?.averageScore === "number" && m.averageScore > 0
        ? m.averageScore
        : null;
    return {
      entry,
      media: m
        ? {
            id: m.id,
            title: mediaTitle(m),
            cover: m.coverImage?.extraLarge ?? m.coverImage?.large ?? null,
            episodes: m.episodes ?? null,
            format: m.format ?? null,
            score,
          }
        : null,
    };
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">My List</h1>
        <p className="text-sm text-muted-foreground">
          {items.length > 0
            ? `${items.length} ${items.length === 1 ? "title" : "titles"} tracked — your list is private to you.`
            : "Track what you watch — your list is private to you."}
        </p>
      </header>

      <ListManager items={items} />

      <p className="text-xs text-muted-foreground">
        Looking for something new?{" "}
        <Link href="/search" className="text-sky-400 hover:underline">
          Browse the catalog
        </Link>
        .
      </p>
    </div>
  );
}
