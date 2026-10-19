"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DailyRewardResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function claimDailyReward(): Promise<DailyRewardResult> {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    if (!authData?.claims?.sub) {
      return { ok: false, error: "Sign in to claim your daily reward." };
    }
    const userId = authData.claims.sub;

    const { data, error } = await supabase.rpc("claim_daily_reward");
    if (error) {
      console.error("[daily] claim failed", error.message);
      return { ok: false, error: "Could not claim your reward. Try again." };
    }

    const result = data as { ok?: boolean; error?: string; reward?: number; streak?: number };
    if (!result?.ok) {
      if (result?.error === "already_claimed") {
        return { ok: false, error: "Already claimed today — come back tomorrow!" };
      }
      return { ok: false, error: "Could not claim your reward. Try again." };
    }

    if ((result.streak ?? 0) >= 7) {
      try {
        const { tryGrantBadge } = await import("@/lib/badge-grants");
        await tryGrantBadge(supabase, userId, "dedicated");
      } catch (badgeError) {
        console.error("[daily] badge grant failed", badgeError);
      }
    }

    revalidatePath("/account");
    return {
      ok: true,
      message: `+${result.reward} Mr.Coins · ${result.streak}-day streak!`,
    };
  } catch (error) {
    console.error("[daily] claim failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
