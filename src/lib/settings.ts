import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdSettings = {
  banner: boolean;
  social: boolean;
};

async function getEnabledSetting(key: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (!data) return true;
    return (data.value as { enabled?: boolean } | null)?.enabled !== false;
  } catch {
    // Env not configured — keep features available rather than hiding them.
    return true;
  }
}

/** Master switch for the Mr.Coin shop. Defaults to enabled if unset. */
export function getShopEnabled(): Promise<boolean> {
  return getEnabledSetting("shop.enabled");
}

/** Sitewide maintenance warning banner. Defaults to visible if unset. */
export function getMaintenanceBannerEnabled(): Promise<boolean> {
  return getEnabledSetting("maintenance.enabled");
}

/** Read ad toggles from site_settings (service role; RLS blocks public reads). */
export async function getAdSettings(): Promise<AdSettings> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_settings")
      .select("key, value")
      .in("key", ["ads.banner", "ads.social"]);
    const enabled = (key: string) =>
      (data ?? []).some((row) => row.key === key && row.value?.enabled === true);
    return { banner: enabled("ads.banner"), social: enabled("ads.social") };
  } catch {
    // Env not configured — never render ads.
    return { banner: false, social: false };
  }
}
