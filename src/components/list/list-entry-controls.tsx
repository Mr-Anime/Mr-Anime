"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ListPlusIcon, MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { removeListEntry, setListProgress, setListStatus } from "@/app/actions/list";
import type { ListActionResult } from "@/app/actions/list";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isListStatus,
  LIST_STATUSES,
  LIST_STATUS_LABELS,
  type ListEntry,
} from "@/lib/list-shared";

type Props = {
  anilistId: number;
  entry: ListEntry | null;
  totalEpisodes: number;
  signedIn: boolean;
  /** where signed-out visitors get sent after login (login?next=…) */
  next?: string;
};

export function ListEntryControls({
  anilistId,
  entry,
  totalEpisodes,
  signedIn,
  next,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    const href = `/login?next=${encodeURIComponent(next ?? `/anime/${anilistId}`)}`;
    return (
      <Button render={<Link href={href} />} variant="outline" size="sm">
        <ListPlusIcon />
        Sign in to add to list
      </Button>
    );
  }

  const watched = entry?.episodes_watched ?? 0;
  const max = totalEpisodes > 0 ? totalEpisodes : 10000;

  const run = (action: () => Promise<ListActionResult>) => {
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={entry?.status ?? ""}
        onValueChange={(value) => {
          if (isListStatus(value)) run(() => setListStatus(anilistId, value));
        }}
        disabled={pending}
      >
        <SelectTrigger size="sm" className="min-w-36" aria-label="List status">
          <SelectValue placeholder="Add to list" />
        </SelectTrigger>
        <SelectContent>
          {LIST_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {LIST_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {entry ? (
        <div className="flex h-7 items-center rounded-lg border border-border/60 pl-1">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="One episode less"
            disabled={pending || watched <= 0}
            onClick={() => run(() => setListProgress(anilistId, watched - 1))}
          >
            <MinusIcon />
          </Button>
          <span
            className="min-w-14 px-0.5 text-center text-xs tabular-nums text-muted-foreground"
            aria-label={`${watched} of ${totalEpisodes || "?"} episodes watched`}
          >
            {watched}
            {totalEpisodes > 0 ? `/${totalEpisodes}` : ""}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="One episode more"
            disabled={pending || watched >= max}
            onClick={() => run(() => setListProgress(anilistId, watched + 1))}
          >
            <PlusIcon />
          </Button>
        </div>
      ) : null}

      {entry ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove from list"
          disabled={pending}
          onClick={() => run(() => removeListEntry(anilistId))}
        >
          <Trash2Icon />
        </Button>
      ) : null}
    </div>
  );
}
