"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type GiftResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const giftSchema = z.object({
  username: z.string().trim().min(1, "Enter a username.").max(30),
  amount: z
    .number()
    .int("Whole coins only.")
    .min(1, "Minimum gift is 1 coin.")
    .max(100000, "Maximum gift is 100,000 coins."),
});

export async function giftCoins(
  username: string,
  amount: number,
): Promise<GiftResult> {
  const parsed = giftSchema.safeParse({ username, amount });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid gift." };
  }

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    if (!authData?.claims?.sub) {
      return { ok: false, error: "Sign in to gift coins." };
    }

    const admin = createAdminClient();
    const { data: target } = await admin
      .from("profiles")
      .select("id, username")
      .ilike("username", parsed.data.username)
      .maybeSingle();
    if (!target) return { ok: false, error: "User not found." };

    const { data, error } = await supabase.rpc("gift_coins", {
      p_receiver: target.id as string,
      p_amount: parsed.data.amount,
    });
    if (error) {
      console.error("[gifting] failed", error.message);
      return { ok: false, error: "Could not send the gift. Try again." };
    }

    const result = data as { ok?: boolean; error?: string };
    if (!result?.ok) {
      const map: Record<string, string> = {
        insufficient: "You do not have that many coins.",
        invalid_target: "You cannot gift yourself.",
        invalid_amount: "Enter a valid amount.",
        user_not_found: "User not found.",
      };
      return { ok: false, error: map[result?.error ?? ""] ?? "Could not send the gift." };
    }

    revalidatePath("/account");
    revalidatePath("/shop");
    return {
      ok: true,
      message: `Sent ${parsed.data.amount.toLocaleString()} coins to ${target.username}!`,
    };
  } catch (error) {
    console.error("[gifting] failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
