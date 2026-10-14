import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { activityDayKey } from "@/lib/activity-shared";

export { activityDayKey };

/**
 * Comment counts per UTC day for the last `days` days.
 * Used by the Activity History heatmap on profiles.
 */
export async function getCommentActivity(
  userId: string,
  days = 182,
): Promise<Record<string, number>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("comments")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", since.toISOString());
    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const key = activityDayKey(new Date(row.created_at));
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  } catch (error) {
    console.error("getCommentActivity failed", error);
    return {};
  }
}
