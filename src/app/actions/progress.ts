"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivityEvent } from "@/lib/activity-shared";

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
    const userId = authData?.claims?.sub;
    if (!userId) return;

    const { error } = await supabase.from("watch_progress").upsert(
      {
        user_id: userId,
        anilist_id: anilistId,
        episode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,anilist_id" },
    );
    if (error) {
      console.error("[progress] record failed", error.message);
    }

    await logActivityEvent(supabase, userId, "watch", `${anilistId}:${episode}`);
  } catch {
    // Signed out or unconfigured — ignore.
  }
}
