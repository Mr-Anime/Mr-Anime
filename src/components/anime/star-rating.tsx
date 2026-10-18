"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { StarIcon } from "lucide-react";
import { toast } from "sonner";
import { setRating } from "@/app/actions/ratings";
import { cn } from "cn";

/** Interactive 1–5 star rating + community average. */
export function StarRating({
  anilistId,
  userScore,
  avg,
  count,
  canRate,
}: {
  anilistId: number;
  userScore: number;
  avg: number;
  count: number;
  canRate: boolean;
}) {
  const router = useRouter();
  const [hover, setHover] = useState(0);
  const [isSaving, startSaving] = useTransition();

  function rate(score: number) {
    if (!canRate || isSaving) return;
    startSaving(async () => {
      const res = await setRating(anilistId, score === userScore ? 0 : score);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const active = hover || userScore;

  return (
    <div className="space-y-1.5">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHover(0)}
        role="group"
        aria-label="Rate this anime"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!canRate || isSaving}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            className={cn(
              "transition-transform",
              canRate && "cursor-pointer hover:scale-110",
              !canRate && "cursor-default",
            )}
            onMouseEnter={() => canRate && setHover(star)}
            onClick={() => rate(star)}
          >
            <StarIcon
              className={cn(
                "size-5",
                star <= active
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/50",
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {count > 0 ? `${avg.toFixed(1)} · ${count} vote${count === 1 ? "" : "s"}` : "No votes yet"}
        </span>
      </div>
      {canRate ? (
        <p className="text-xs text-muted-foreground">
          {userScore > 0
            ? `Your rating: ${userScore}/5 — click again to remove.`
            : "Click a star to rate."}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Sign in to rate.</p>
      )}
    </div>
  );
}
