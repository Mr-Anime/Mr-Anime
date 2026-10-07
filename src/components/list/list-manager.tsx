"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ListPlusIcon, TvIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListEntryControls } from "@/components/list/list-entry-controls";
import {
  LIST_STATUSES,
  LIST_STATUS_LABELS,
  type ListItem,
  type ListStatus,
} from "@/lib/list-shared";

type Tab = "all" | ListStatus;

type Props = {
  items: ListItem[];
};

export function ListManager({ items }: Props) {
  const [tab, setTab] = useState<Tab>("all");

  const counts = useMemo(() => {
    const out = { all: items.length } as Record<Tab, number>;
    for (const status of LIST_STATUSES) {
      out[status] = items.filter((i) => i.entry.status === status).length;
    }
    return out;
  }, [items]);

  const filtered = useMemo(
    () => (tab === "all" ? items : items.filter((i) => i.entry.status === tab)),
    [items, tab],
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/70 px-6 py-14 text-center">
        <ListPlusIcon className="size-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">Your list is empty</p>
          <p className="text-sm text-muted-foreground">
            Open any anime and set a status — it will show up here.
          </p>
        </div>
        <Button render={<Link href="/search" />} variant="outline">
          Browse anime
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          {LIST_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status}>
              {LIST_STATUS_LABELS[status]} ({counts[status]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ul className="space-y-3">
        {filtered.map(({ entry, media }) => {
          const href = `/anime/${entry.anilist_id}`;
          const meta = [
            media?.format,
            media?.episodes ? `${media.episodes} eps` : null,
            media?.score ? `Score ${(media.score / 10).toFixed(1)}` : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <li
              key={entry.anilist_id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-card p-3 sm:flex-nowrap"
            >
              <Link
                href={href}
                className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-muted"
                aria-label={media?.title ?? `Anime ${entry.anilist_id}`}
              >
                {media?.cover ? (
                  <Image
                    src={media.cover}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-muted-foreground">
                    <TvIcon className="size-5" />
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="space-y-0.5">
                  <Link
                    href={href}
                    className="line-clamp-1 font-medium hover:underline"
                  >
                    {media?.title ?? `Anime #${entry.anilist_id}`}
                  </Link>
                  {meta ? (
                    <p className="text-xs text-muted-foreground">{meta}</p>
                  ) : null}
                </div>
                <ListEntryControls
                  anilistId={entry.anilist_id}
                  entry={entry}
                  totalEpisodes={media?.episodes ?? 0}
                  signedIn
                  next="/list"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
