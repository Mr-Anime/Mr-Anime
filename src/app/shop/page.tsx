import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CoinsIcon } from "lucide-react";
import { getCommentViewer } from "@/lib/comments";
import { createClient } from "@/lib/supabase/server";
import { EMPTY_COSMETICS, type Cosmetics, type ShopKind } from "@/lib/cosmetics";
import { NitroCard } from "@/components/shop/nitro-card";
import { ShopClient, type ShopItemView } from "@/components/shop/shop-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Spend Mr.Coin on profile frames, name styles and name animations earned by watching anime.",
};

export default async function ShopPage() {
  const viewer = await getCommentViewer();
  if (!viewer) redirect("/login?next=/shop");

  let coins = 0;
  let items: ShopItemView[] = [];
  let owned: string[] = [];
  let loadout: Cosmetics = EMPTY_COSMETICS;
  let nitroUntil: string | null = null;
  let badges: string[] = [];

  try {
    const supabase = await createClient();
    const [walletRes, itemsRes, ownedRes, loadoutRes, profileRes] = await Promise.all([
      supabase.from("wallets").select("coins").maybeSingle(),
      supabase
        .from("shop_items")
        .select("id, name, description, kind, price")
        .eq("active", true)
        .order("price", { ascending: true }),
      supabase.from("user_items").select("item_id"),
      supabase
        .from("user_loadout")
        .select("frame, name_style, name_animation")
        .maybeSingle(),
      supabase.from("profiles").select("nitro_until, badges").eq("id", viewer.id).maybeSingle(),
    ]);

    if (walletRes.error) console.error("[shop] wallet failed", walletRes.error.message);
    if (itemsRes.error) console.error("[shop] items failed", itemsRes.error.message);
    if (ownedRes.error) console.error("[shop] owned failed", ownedRes.error.message);
    if (loadoutRes.error) console.error("[shop] loadout failed", loadoutRes.error.message);
    if (profileRes.error) console.error("[shop] profile failed", profileRes.error.message);

    coins = (walletRes.data?.coins as number | undefined) ?? 0;
    items = (itemsRes.data ?? []) as unknown as ShopItemView[];
    owned = (ownedRes.data ?? []).map((r) => r.item_id as string);
    if (loadoutRes.data) {
      loadout = {
        frame: loadoutRes.data.frame,
        nameStyle: loadoutRes.data.name_style,
        nameAnimation: loadoutRes.data.name_animation,
      };
    }
    if (profileRes.data) {
      nitroUntil = profileRes.data.nitro_until;
      badges = (profileRes.data.badges as string[] | undefined) ?? [];
    }
  } catch (error) {
    console.error("[shop] load failed", error);
  }

  const kinds = new Set<string>(items.map((i) => i.kind as ShopKind));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-5">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <CoinsIcon className="size-6 text-amber-400" />
            Mr. Coin Shop
          </h1>
          <p className="text-sm text-muted-foreground">
            Watch episodes to earn Mr.Coin — random drops every ~10 minutes. Spend them on
            frames, name styles and name animations that show up everywhere you appear.
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-right">
          <p className="text-2xl font-bold text-amber-400">{coins.toLocaleString()}</p>
          <p className="text-xs text-amber-500/80">Mr.Coin balance</p>
        </div>
      </header>

      <NitroCard badges={badges} nitroUntil={nitroUntil} coins={coins} />

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
          The shop catalogue is empty. Apply{" "}
          <code className="rounded bg-muted px-1">supabase/migrations/0006_shop.sql</code>{" "}
          in Supabase to load it.
        </p>
      ) : (
        <ShopClient
          items={items}
          owned={owned}
          loadout={loadout}
          coins={coins}
          kinds={kinds}
        />
      )}
    </div>
  );
}
