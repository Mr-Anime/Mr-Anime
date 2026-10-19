import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TicketPercentIcon } from "lucide-react";
import { RedeemForm } from "@/components/redeem/redeem-form";
import { RewardShop } from "@/components/redeem/reward-shop";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { tryCreateClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Redeem",
  description: "Redeem codes and spend Mr.Coin on rewards.",
};

export const dynamic = "force-dynamic";

type ClaimRow = {
  created_at: string;
  coins: number;
  badge: string | null;
  code: { code: string } | null;
};

function isFuture(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}

export default async function RedeemPage() {
  const supabase = await tryCreateClient();
  if (!supabase) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-28 text-center">
        <h1 className="text-xl font-semibold">Supabase is not configured</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
          <code className="font-mono">.env.local</code>.
        </p>
      </div>
    );
  }
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims?.sub) redirect("/login?next=/redeem");
  const userId = authData.claims.sub;

  const [walletRes, claimsRes, profileRes] = await Promise.all([
    supabase.from("wallets").select("coins").eq("user_id", userId).maybeSingle(),
    supabase
      .from("redeem_claims")
      .select("created_at, coins, badge, code:redeem_codes(code)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("profiles").select("badges, nitro_until").eq("id", userId).single(),
  ]);

  const coins = walletRes.data?.coins ?? 0;
  const claims: ClaimRow[] = (claimsRes.data ?? []) as unknown as ClaimRow[];
  const badges = (profileRes.data?.badges as string[] | null) ?? [];
  const nitroUntil = (profileRes.data?.nitro_until as string | null) ?? null;
  const nitroActive = isFuture(nitroUntil);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <TicketPercentIcon className="size-6 text-sky-400" />
            Redeem
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a code for instant Mr.Coins, or spend Mr.Coin on permanent rewards.
          </p>
        </div>
        <Badge className="h-6 gap-1 rounded-full px-3 text-xs">
          💰 {coins.toLocaleString()} Mr.Coins
        </Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Redeem a code</CardTitle>
          <CardDescription>
            Got a code from an event or giveaway? Claim it once — codes can expire or
            run out of uses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RedeemForm />
        </CardContent>
      </Card>

      <RewardShop coins={coins} owned={badges} nitroUntil={nitroUntil} nitroActive={nitroActive} />

      <section aria-label="Redemption history">
        <h2 className="mb-2 text-sm font-semibold tracking-tight">Claim history</h2>
        {claims.length === 0 ? (
          <p className="rounded-xl border border-border/60 bg-card px-4 py-6 text-sm text-muted-foreground">
            No codes claimed yet.{" "}
            <Link href="/shop" className="text-sky-400 hover:underline">
              Earn Mr.Coin in the shop →
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card text-sm">
            {claims.map((c, i) => (
              <li
                key={`${c.code?.code ?? "code"}-${i}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-semibold">
                    {c.code?.code ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {c.badge ? ` · badge: ${c.badge}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-medium text-emerald-400">
                  {c.coins > 0 ? `+${c.coins}` : "badge"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
