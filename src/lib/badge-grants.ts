import "server-only";
import type { createClient } from "@/lib/supabase/server";

type SupabaseUser = Awaited<ReturnType<typeof createClient>>;

/**
 * Best-effort self-grant of a badge the viewer has earned (own profile row —
 * RLS allows own updates). Never throws; never grants if already present.
 */
export async function tryGrantBadge(
  supabase: SupabaseUser,
  userId: string,
  badge: string,
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("badges")
      .eq("id", userId)
      .single();
    if (!profile) return;
    const current = Array.isArray(profile.badges) ? (profile.badges as string[]) : [];
    if (current.includes(badge)) return;

    const { error } = await supabase
      .from("profiles")
      .update({ badges: [...current, badge] })
      .eq("id", userId);
    if (error) {
      console.error("[badges] grant failed", badge, error.message);
    }
  } catch (error) {
    console.error("[badges] grant failed", badge, error);
  }
}
