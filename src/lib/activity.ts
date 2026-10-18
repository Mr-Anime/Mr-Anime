import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { activityDayKey } from "@/lib/activity-shared";

export { activityDayKey };

/**
 * Activity counts per UTC day for the last `days` days — comments + watch
 * + list-add events. Used by the Activity History heatmap on profiles.
 */
export async function getCommentActivity(
  userId: string,
  days = 182,
): Promise<Record<string, number>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const counts: Record<string, number> = {};
  try {
    const admin = createAdminClient();

    const [comments, events] = await Promise.all([
      admin
        .from("comments")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", since.toISOString()),
      admin
        .from("activity_events")
        .select("day")
        .eq("user_id", userId)
        .gte("day", since.toISOString().slice(0, 10)),
    ]);

    for (const row of comments.data ?? []) {
      const key = activityDayKey(new Date(row.created_at as string));
      counts[key] = (counts[key] ?? 0) + 1;
    }
    for (const row of events.data ?? []) {
      const key = String(row.day);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    if (comments.error) throw comments.error;
    if (events.error) throw events.error;

    return counts;
  } catch (error) {
    console.error("getCommentActivity failed", error);
    return {};
  }
}
