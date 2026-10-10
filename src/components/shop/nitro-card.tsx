"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CoinsIcon, FlameIcon } from "lucide-react";
import { toast } from "sonner";
import { buyNitro } from "@/app/actions/shop";
import { Button } from "@/components/ui/button";
import { NITRO_DAYS, NITRO_PRICE, isNitroActive } from "@/lib/nitro";
import { cn } from "cn";

const PERKS = [
  "Blue flame border around your profile (all 4 sides)",
  "Flaming hover card in comments",
  "Blue aura around your avatar everywhere",
  "Animated NITRO badge next to your name",
];

type Props = {
  badges: string[];
  nitroUntil: string | null;
  coins: number;
};

export function NitroCard({ badges, nitroUntil, coins }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const active = isNitroActive({ badges, nitro_until: nitroUntil });
  const affordable = coins >= NITRO_PRICE;

  function purchase() {
    startTransition(async () => {
      const res = await buyNitro();
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <section
      aria-label="Mr. Anime Nitro"
      className={cn(
        "overflow-hidden rounded-xl border bg-card p-5",
        active
          ? "nitro-flame border-transparent"
          : "border-border/60 bg-gradient-to-br from-sky-500/10 via-card to-indigo-500/10",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <FlameIcon className={cn("size-5", active ? "text-cyan-400" : "text-sky-500")} />
            Mr. Anime Nitro
            {active ? (
              <span className="flex items-center gap-1 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
                <CheckIcon className="size-3" />
                Active
              </span>
            ) : null}
          </h2>
          <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-1.5">
                <FlameIcon className="mt-0.5 size-3.5 shrink-0 text-cyan-500" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {active && nitroUntil ? (
            <p className="text-xs text-muted-foreground">
              Until{" "}
              {new Date(nitroUntil).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          ) : null}
          <p className="flex items-center gap-1.5 text-lg font-bold text-amber-400">
            <CoinsIcon className="size-5" />
            {NITRO_PRICE.toLocaleString()}
            <span className="text-xs font-normal text-muted-foreground">
              / {NITRO_DAYS} days
            </span>
          </p>
          <Button
            disabled={isPending || !affordable}
            onClick={purchase}
            className={cn(!active && "bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500")}
          >
            {isPending
              ? "Working…"
              : !affordable
                ? "Not enough Mr.Coin"
                : active
                  ? "Renew"
                  : "Buy Nitro"}
          </Button>
        </div>
      </div>
    </section>
  );
}
