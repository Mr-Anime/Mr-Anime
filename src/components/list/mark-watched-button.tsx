"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { CheckIcon, EyeIcon } from "lucide-react";
import { markEpisodeWatched } from "@/app/actions/list";
import type { ListActionResult } from "@/app/actions/list";
import { Button } from "@/components/ui/button";
import { LIST_STATUS_LABELS, type ListEntry } from "@/lib/list-shared";

type Props = {
  anilistId: number;
  episode: number;
  totalEpisodes: number;
  entry: ListEntry | null;
  signedIn: boolean;
  /** current watch path — sent to login so users come back */
  next: string;
};

export function MarkWatchedButton({
  anilistId,
  episode,
  totalEpisodes,
  entry,
  signedIn,
  next,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Button
        render={<Link href={`/login?next=${encodeURIComponent(next)}`} />}
        variant="outline"
        size="sm"
      >
        <EyeIcon />
        Sign in to track progress
      </Button>
    );
  }

  const watched = entry?.episodes_watched ?? 0;
  const alreadyWatched = episode <= watched;

  const mark = () => {
    startTransition(async () => {
      const res: ListActionResult = await markEpisodeWatched(
        anilistId,
        episode,
        totalEpisodes,
      );
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {entry ? (
          <>
            Progress{" "}
            <span className="font-medium tabular-nums text-foreground">
              {watched}
              {totalEpisodes > 0 ? `/${totalEpisodes}` : ""}
            </span>{" "}
            · {LIST_STATUS_LABELS[entry.status]}
          </>
        ) : (
          "Not on your list yet — watching adds it."
        )}
      </p>
      <Button
        variant={alreadyWatched ? "secondary" : "default"}
        size="sm"
        disabled={pending || alreadyWatched}
        onClick={mark}
      >
        {alreadyWatched ? (
          <>
            <CheckIcon />
            Watched
          </>
        ) : (
          "Mark as watched"
        )}
      </Button>
    </div>
  );
}
