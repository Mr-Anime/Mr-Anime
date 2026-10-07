"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  MonitorPlayIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReportDialog } from "@/components/watch/report-dialog";

export type PlayerProvider = { id: string; name: string; url: string };
export type AudioLang = "sub" | "dub";

type Props = {
  providers: PlayerProvider[];
  mediaId: number;
  episode: number;
  title: string;
  episodeTitle?: string | null;
  totalEpisodes: number;
  /** current audio language (from ?lang=) */
  lang?: AudioLang;
  /** whether any provider URL varies with sub/dub */
  langSupported?: boolean;
  /** current search params string (?s=…&lang=dub) for prev/next links */
  query?: string;
};

function langHref(mediaId: number, episode: number, query: string, lang: AudioLang) {
  const params = new URLSearchParams(query);
  if (lang === "dub") params.set("lang", "dub");
  else params.delete("lang");
  const qs = params.toString();
  return `/watch/${mediaId}/${episode}${qs ? `?${qs}` : ""}`;
}

export function PlayerHost({
  providers,
  mediaId,
  episode,
  title,
  episodeTitle,
  totalEpisodes,
  lang = "sub",
  langSupported = false,
  query = "",
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(providers[0]?.id ?? null);

  const active = useMemo(
    () => providers.find((p) => p.id === activeId) ?? providers[0] ?? null,
    [providers, activeId],
  );

  const hasPrev = episode > 1;
  const hasNext = totalEpisodes === 0 || episode < totalEpisodes;
  const providerName = active?.name ?? "none";
  const qs = query ? `?${query}` : "";

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-black">
        {active ? (
          <iframe
            key={active.id}
            src={active.url}
            title={`${title} — episode ${episode} on ${active.name}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
            <MonitorPlayIcon className="size-8" />
            <p className="text-sm font-medium text-foreground">
              No playback provider configured
            </p>
            <p className="max-w-md text-xs">
              Set <code className="font-mono">PROVIDER_1_BASE</code> (and
              <code className="font-mono"> PROVIDER_1_NAME</code>) in the server
              environment — sources are never hard-coded in the app.
            </p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5" role="tablist" aria-label="Playback providers">
          {providers.map((p) => (
            <Button
              key={p.id}
              variant={p.id === active?.id ? "default" : "outline"}
              size="sm"
              role="tab"
              aria-selected={p.id === active?.id}
              onClick={() => setActiveId(p.id)}
            >
              {p.name}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {langSupported ? (
            <div
              className="mr-1 flex items-center rounded-lg border border-border/60 p-0.5"
              role="group"
              aria-label="Audio language"
            >
              {(["sub", "dub"] as const).map((l) => (
                <Button
                  key={l}
                  variant={l === lang ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={l === lang}
                  render={<Link href={langHref(mediaId, episode, query, l)} />}
                >
                  {l === "sub" ? "Sub" : "Dub"}
                </Button>
              ))}
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasPrev}
            render={hasPrev ? <Link href={`/watch/${mediaId}/${episode - 1}${qs}`} /> : undefined}
          >
            <ChevronLeftIcon />
            Prev
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasNext}
            render={hasNext ? <Link href={`/watch/${mediaId}/${episode + 1}${qs}`} /> : undefined}
          >
            Next
            <ChevronRightIcon />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/anime/${mediaId}`} />}
          >
            <InfoIcon />
            Details
          </Button>
          <ReportDialog
            mediaId={mediaId}
            episode={episode}
            provider={providerName}
            title={title}
          />
        </div>
      </div>

      {episodeTitle ? (
        <p className="text-sm text-muted-foreground">
          Episode {episode}: <span className="text-foreground">{episodeTitle}</span>
        </p>
      ) : null}
    </div>
  );
}
