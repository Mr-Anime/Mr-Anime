"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ShopActionResult =
  | { ok: true; message: string; coins: number }
  | { ok: false; error: string };

export type NitroActionResult =
  | { ok: true; message: string; coins: number; nitroUntil: string | null }
  | { ok: false; error: string };

const itemIdSchema = z.string().min(1).max(60);
const slotSchema = z.enum(["frame", "name_style", "name_animation"]);

function mapPurchaseError(raw: string): string {
  if (raw.includes("already owned")) return "You already own that item.";
  return "Could not purchase that item. Try again.";
}

export async function purchaseShopItem(itemId: string): Promise<ShopActionResult> {
  const parsedId = itemIdSchema.safeParse(itemId);
  if (!parsedId.success) return { ok: false, error: "Invalid item." };

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    if (!authData?.claims?.sub) {
      return { ok: false, error: "Sign in to shop with Mr.Coin." };
    }

    const { data, error } = await supabase.rpc("shop_purchase", {
      p_item_id: parsedId.data,
    });
    if (error) {
      console.error("[shop] purchase failed", error.message);
      return { ok: false, error: mapPurchaseError(error.message) };
    }

    const result = data as { ok?: boolean; coins?: number; error?: string };
    if (!result?.ok) {
      switch (result?.error) {
        case "insufficient":
          return { ok: false, error: "Not enough Mr.Coin — keep watching to earn more." };
        case "not_found":
          return { ok: false, error: "That item is not available." };
        case "auth":
          return { ok: false, error: "Sign in to shop with Mr.Coin." };
        default:
          return { ok: false, error: "Could not purchase that item. Try again." };
      }
    }

    revalidatePath("/shop");
    return {
      ok: true,
      message: "Purchased — equip it from your collection!",
      coins: result.coins ?? 0,
    };
  } catch (error) {
    console.error("[shop] purchase failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

export async function equipShopItem(
  slot: string,
  itemId: string | null,
): Promise<ShopActionResult> {
  const parsedSlot = slotSchema.safeParse(slot);
  const parsedId = itemId === null ? { success: true as const, data: null } : itemIdSchema.safeParse(itemId);
  if (!parsedSlot.success || !parsedId.success) {
    return { ok: false, error: "Invalid item." };
  }

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    if (!authData?.claims?.sub) {
      return { ok: false, error: "Sign in first." };
    }

    const { data, error } = await supabase.rpc("shop_equip", {
      p_slot: parsedSlot.data,
      p_item_id: parsedId.data ?? null,
    });
    if (error) {
      console.error("[shop] equip failed", error.message);
      return { ok: false, error: "Could not update your loadout. Try again." };
    }

    const result = data as { ok?: boolean; error?: string };
    if (!result?.ok) {
      switch (result?.error) {
        case "not_owned":
          return { ok: false, error: "Buy that item first." };
        case "not_found":
          return { ok: false, error: "That item is not available." };
        case "auth":
          return { ok: false, error: "Sign in first." };
        default:
          return { ok: false, error: "Could not update your loadout. Try again." };
      }
    }

    revalidatePath("/shop");
    return {
      ok: true,
      message: parsedId.data ? "Equipped." : "Unequipped.",
      coins: 0,
    };
  } catch (error) {
    console.error("[shop] equip failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

/** Buy (or renew) Mr. Anime Nitro for 30 days with Mr.Coin. */
export async function buyNitro(): Promise<NitroActionResult> {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    if (!authData?.claims?.sub) {
      return { ok: false, error: "Sign in to buy Nitro." };
    }

    const { data, error } = await supabase.rpc("buy_nitro");
    if (error) {
      console.error("[shop] nitro purchase failed", error.message);
      return { ok: false, error: "Could not purchase Nitro. Try again." };
    }

    const result = data as { ok?: boolean; coins?: number; nitro_until?: string; error?: string };
    if (!result?.ok) {
      switch (result?.error) {
        case "insufficient":
          return {
            ok: false,
            error: "Not enough Mr.Coin for Nitro — keep watching to earn more.",
          };
        case "auth":
          return { ok: false, error: "Sign in to buy Nitro." };
        default:
          return { ok: false, error: "Could not purchase Nitro. Try again." };
      }
    }

    revalidatePath("/shop");
    return {
      ok: true,
      message: "Welcome to Mr. Anime Nitro!",
      coins: result.coins ?? 0,
      nitroUntil: result.nitro_until ?? null,
    };
  } catch (error) {
    console.error("[shop] nitro purchase failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
