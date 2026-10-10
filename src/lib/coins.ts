import "server-only";
import { tryCreateClient } from "@/lib/supabase/server";

/**
 * Claim the random Mr.Coin drop for the signed-in viewer (called from the
 * watch page). Returns 0 when signed out, unconfigured, on cooldown or when
 * the shop RPCs are not migrated yet.
 */
export async function tryClaimCoinDrop(): Promise<number> {
  try {
    const supabase = await tryCreateClient();
    if (!supabase) return 0;

    const { data: authData } = await supabase.auth.getClaims();
    if (!authData?.claims?.sub) return 0;

    const { data, error } = await supabase.rpc("coin_drop");
    if (error) {
      console.error("[coins] drop failed", error.message);
      return 0;
    }
    return typeof data === "number" && data > 0 ? data : 0;
  } catch (error) {
    console.error("[coins] drop failed", error);
    return 0;
  }
}
