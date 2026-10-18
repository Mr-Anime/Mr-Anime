"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CoinsIcon, FlameIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { claimDailyReward } from "@/app/actions/daily";
import { Button } from "@/components/ui/button";

export function DailyRewardCard({
  streak,
  longest,
  claimedToday,
}: {
  streak: number;
  longest: number;
  claimedToday: boolean;
}) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const nextStreak = claimedToday ? streak : streak + 1;
  const nextReward = Math.min(25 * nextStreak, 250);

  function claim() {
    startSaving(async () => {
      const res = await claimDailyReward();
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <FlameIcon className="size-4 text-orange-400" />
          {streak}-day streak
          <span className="font-normal text-muted-foreground">
            (best {longest})
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {claimedToday
            ? "Come back tomorrow to keep the streak alive."
            : "Daily claim grows with your streak — up to 250 coins."}
        </p>
      </div>
      <Button onClick={claim} disabled={isSaving || claimedToday} size="sm">
        {isSaving ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <CoinsIcon />
        )}
        {claimedToday ? "Claimed today" : `Claim +${nextReward}`}
      </Button>
    </div>
  );
}
