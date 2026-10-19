"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlameIcon, HeartHandshakeIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { buyReward } from "@/app/actions/redeem";
import { buyNitro } from "@/app/actions/shop";
import { NITRO_REWARD, REWARD_CATALOG } from "@/lib/rewards";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "cn";

const KEY_ICONS: Record<string, React.ReactNode> = {
  supporter: <HeartHandshakeIcon className="size-5 text-rose-400" />,
  nebula: <SparklesIcon className="size-5 text-purple-400" />,
};

export function RewardShop({
  coins,
  owned,
  nitroUntil,
  nitroActive,
}: {
  coins: number;
  owned: string[];
  nitroUntil: string | null;
  nitroActive: boolean;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function handleBuy(key: string, catalogOwned: boolean) {
    if (pendingKey) return;
    setPendingKey(key);
    try {
      if (catalogOwned) return;
      const res = key === NITRO_REWARD.key ? await buyNitro() : await buyReward(key);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redeem rewards with Mr.Coin</CardTitle>
        <CardDescription>
          Permanent perks — no expiry. Balance:{" "}
          <span className="font-medium text-foreground">{coins.toLocaleString()}</span>{" "}
          Mr.Coins.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {REWARD_CATALOG.map((r) => {
          const isOwned = owned.includes(r.badgeKey);
          const affordable = coins >= r.price;
          const pending = pendingKey === r.key;
          return (
            <div
              key={r.key}
              className="flex flex-col gap-2 rounded-xl border border-border/60 p-3"
            >
              <div className="flex items-center gap-2">
                {KEY_ICONS[r.key] ?? null}
                <p className="text-sm font-semibold leading-tight">{r.label}</p>
              </div>
              <p className="flex-1 text-xs text-muted-foreground">{r.description}</p>
              <Button
                size="sm"
                variant={isOwned ? "outline" : "default"}
                disabled={isOwned || pending || !affordable}
                onClick={() => handleBuy(r.key, isOwned)}
                className={cn("w-full", affordable && !isOwned && "bg-sky-500 hover:bg-sky-400")}
              >
                {pending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : isOwned ? (
                  "Owned ✓"
                ) : (
                  `${r.price.toLocaleString()} Mr.Coins`
                )}
              </Button>
            </div>
          );
        })}

        <div className="flex flex-col gap-2 rounded-xl border border-border/60 p-3">
          <div className="flex items-center gap-2">
            <FlameIcon className="size-5 text-cyan-400" />
            <p className="text-sm font-semibold leading-tight">{NITRO_REWARD.label}</p>
          </div>
          <p className="flex-1 text-xs text-muted-foreground">{NITRO_REWARD.description}</p>
          <Button
            size="sm"
            variant={nitroActive ? "outline" : "default"}
            disabled={nitroActive || pendingKey !== null || coins < NITRO_REWARD.price}
            onClick={() => handleBuy(NITRO_REWARD.key, false)}
            className={cn(
              "w-full",
              !nitroActive && coins >= NITRO_REWARD.price && "bg-sky-500 hover:bg-sky-400",
            )}
          >
            {pendingKey === NITRO_REWARD.key ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : nitroActive ? (
              `Active until ${new Date(nitroUntil!).toLocaleDateString()}`
            ) : (
              `${NITRO_REWARD.price.toLocaleString()} Mr.Coins`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
