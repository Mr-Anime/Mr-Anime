"use server";

import { createClient } from "@/lib/supabase/server";

/** Fire-and-forget watch progress (continue watching + profile stats). */
export async function recordWatch(
  anilistId: number,
  episode: number,
): Promise<void> {
  if (!Number.isInteger(anilistId) || !Number.isInteger(episode) || episode < 1) {
    return;
  }
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    if (!authData?.claims?.sub) return;

    const { error } = await supabase.from("watch_progress").upsert(
      {
        user_id: authData.claims.sub,
        anilist_id: anilistId,
        episode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,anilist_id" },
    );
    if (error) {
      console.error("[progress] record failed", error.message);
    }
  } catch {
    // Signed out or unconfigured — ignore.
  }
}
