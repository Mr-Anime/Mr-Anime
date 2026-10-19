import type { Metadata } from "next";
import { RedeemCodesManager } from "@/components/admin/redeem-codes-manager";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Redeem codes",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export type RedeemCodeRow = {
  id: string;
  code: string;
  coins: number;
  badge: string | null;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
};

export default async function AdminRedeemPage() {
  let codes: RedeemCodeRow[] = [];
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("redeem_codes")
      .select(
        "id, code, coins, badge, max_uses, uses, expires_at, active, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    codes = (data ?? []) as RedeemCodeRow[];
  } catch (error) {
    console.error("[admin/redeem] list failed", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Redeem codes</h2>
        <p className="text-sm text-muted-foreground">
          Generate codes for coins and bonus badges — users claim them on{" "}
          <span className="font-mono text-foreground">/redeem</span>.
        </p>
      </div>
      <RedeemCodesManager codes={codes} />
    </div>
  );
}
