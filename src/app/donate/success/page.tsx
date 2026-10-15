import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheckIcon, ClockIcon, CoinsIcon, HeartHandshakeIcon, Undo2Icon } from "lucide-react";
import { DonateStatusPoller } from "@/components/donations/donate-status-poller";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "cn";

export const metadata: Metadata = { title: "Thank you · Donate" };
export const dynamic = "force-dynamic";

type DonationRow = {
  order_id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  user_id: string | null;
  reward_coins: number | null;
  rewarded: boolean;
};

export default async function DonateSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: orderId } = await searchParams;

  let donation: DonationRow | null = null;
  if (orderId) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("donations")
        .select("order_id, amount, status, paid_at, user_id, reward_coins, rewarded")
        .eq("order_id", orderId)
        .maybeSingle();
      donation = (data as DonationRow | null) ?? null;
    } catch {
      donation = null;
    }
  }

  const isPaid = donation?.status === "Paid";
  const isPending = donation !== null && !isPaid;
  const rewardCoins = isPaid ? (donation?.reward_coins ?? 0) : 0;
  const gotReward = rewardCoins > 0;

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-14 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-sky-500/10">
        <HeartHandshakeIcon className="size-7 text-sky-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {isPaid ? "Thank you!" : "Thank you for your support!"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isPaid ? (
            <>
              Your donation of{" "}
              <span className="font-semibold text-foreground">
                ${Number(donation?.amount ?? 0).toFixed(2)}
              </span>{" "}
              has been received.
            </>
          ) : isPending ? (
            "Your payment is being confirmed on the blockchain — this page updates automatically."
          ) : (
            "Your support means a lot — it keeps Mr.Anime running."
          )}
        </p>
      </div>

      {gotReward ? (
        <Card>
          <CardContent className="space-y-1.5 px-4 py-4 text-sm">
            <p className="flex items-center justify-center gap-2 font-semibold text-amber-400">
              <CoinsIcon className="size-4" />+{rewardCoins} Mr.Coins added
            </p>
            <p className="flex items-center justify-center gap-2 text-muted-foreground">
              <HeartHandshakeIcon className="size-4 text-rose-400" />
              Permanent <span className="font-medium text-rose-400">Supporter</span> badge granted
            </p>
          </CardContent>
        </Card>
      ) : isPaid && donation?.user_id === null ? (
        <Card>
          <CardContent className="px-4 py-4 text-center text-sm text-muted-foreground">
            Signed-in members earn Mr.Coins + a Supporter badge when they
            donate — next time!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 px-4 py-4 text-sm">
            {isPaid ? (
              <>
                <CircleCheckIcon className="size-4 text-emerald-500" />
                <span className="font-medium text-emerald-500">Paid</span>
              </>
            ) : isPending ? (
              <>
                <ClockIcon className="size-4 text-amber-500 animate-pulse" />
                <span className="font-medium text-amber-500">
                  {donation?.status ?? "Confirming"}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {orderId ? "Status unavailable" : "No order reference"}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className={cn(buttonVariants(), "no-tap-highlight")}>
          <Undo2Icon />
          Back home
        </Link>
        <Link
          href="/donate"
          className={cn(buttonVariants({ variant: "outline" }), "no-tap-highlight")}
        >
          Donate again
        </Link>
      </div>

      <DonateStatusPoller done={!isPending} />
    </div>
  );
}
