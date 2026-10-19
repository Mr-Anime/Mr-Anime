"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { REWARD_CATALOG } from "@/lib/rewards";

export type RedeemActionResult =
  | { ok: true; message: string; coins: number }
  | { ok: false; error: string };

const codeSchema = z.string().trim().min(3).max(64);

function mapRedeemError(raw: string): string {
  if (raw.includes("already_claimed")) return "You already claimed that code.";
  if (raw.includes("invalid")) return "Invalid or expired code.";
  if (raw.includes("auth")) return "Sign in to redeem a code.";
  return "Could not redeem that code. Try again.";
}

/** Claim a redeem code (coins + optional bonus badge). */
export async function submitRedeemCode(code: string): Promise<RedeemActionResult> {
  const parsed = codeSchema.safeParse(code);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid code." };
  }

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    if (!authData?.claims?.sub) {
      return { ok: false, error: "Sign in to redeem a code." };
    }
    const userId = authData.claims.sub;

    const userLimit = rateLimit(`redeem:${userId}`, { limit: 5, windowMs: 10 * 60_000 });
    const ip = await clientIp();
    const ipLimit = rateLimit(`redeem-ip:${ip}`, { limit: 10, windowMs: 10 * 60_000 });
    if (!userLimit.ok || !ipLimit.ok) {
      return { ok: false, error: "Too many attempts — try again in a few minutes." };
    }

    const { data, error } = await supabase.rpc("redeem_code", {
      p_code: parsed.data,
    });
    if (error) {
      console.error("[redeem] claim failed", error.message);
      return { ok: false, error: mapRedeemError(error.message) };
    }

    const result = data as {
      ok?: boolean;
      error?: string;
      coins_earned?: number;
      coins?: number;
      badge?: string | null;
    };
    if (!result?.ok) {
      return { ok: false, error: mapRedeemError(result?.error ?? "failed") };
    }

    revalidatePath("/redeem");
    const parts: string[] = [];
    if ((result.coins_earned ?? 0) > 0) parts.push(`+${result.coins_earned} Mr.Coins`);
    if (result.badge) parts.push(`"${result.badge}" badge unlocked!`);
    if (parts.length === 0) parts.push("Code redeemed.");
    return { ok: true, message: parts.join(" · "), coins: result.coins ?? 0 };
  } catch (error) {
    console.error("[redeem] claim failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

/** Spend Mr.Coin on a permanent reward from the catalog. */
export async function buyReward(key: string): Promise<RedeemActionResult> {
  const reward = REWARD_CATALOG.find((r) => r.key === key);
  if (!reward) return { ok: false, error: "That reward does not exist." };

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    if (!authData?.claims?.sub) {
      return { ok: false, error: "Sign in to redeem rewards." };
    }

    const { data, error } = await supabase.rpc("buy_reward", { p_key: reward.key });
    if (error) {
      console.error("[redeem] buy failed", error.message);
      return { ok: false, error: "Could not purchase that reward. Try again." };
    }

    const result = data as { ok?: boolean; error?: string; coins?: number };
    if (!result?.ok) {
      switch (result?.error) {
        case "insufficient":
          return { ok: false, error: `Not enough Mr.Coin — you need ${reward.price}.` };
        case "already_owned":
          return { ok: false, error: "You already own that reward." };
        case "auth":
          return { ok: false, error: "Sign in to redeem rewards." };
        default:
          return { ok: false, error: "Could not purchase that reward. Try again." };
      }
    }

    revalidatePath("/redeem");
    return {
      ok: true,
      message: `${reward.label} unlocked!`,
      coins: result.coins ?? 0,
    };
  } catch (error) {
    console.error("[redeem] buy failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
