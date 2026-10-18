import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { activityDayKey } from "@/lib/activity-shared";

export { activityDayKey };

export type ActivityBreakdown = {
  comments: number;
  watch: number;
  list_add: number;
  forum: number;
  rating: number;
};

export type ActivityData = {
  counts: Record<string, number>;
  breakdown: Record<string, ActivityBreakdown>;
  total: number;
  currentStreak: number;
};

function emptyBreakdown(): ActivityBreakdown {
  return { comments: 0, watch: 0, list_add: 0, forum: 0, rating: 0 };
}

function addDay(
  counts: Record<string, number>,
  breakdown: Record<string, ActivityBreakdown>,
  key: string,
  kind: keyof ActivityBreakdown,
): void {
  counts[key] = (counts[key] ?? 0) + 1;
  const b = breakdown[key] ?? (breakdown[key] = emptyBreakdown());
  b[kind] += 1;
}

/** Consecutive active days ending today (or yesterday when today is empty). */
function computeStreak(counts: Record<string, number>): number {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if ((counts[activityDayKey(start)] ?? 0) === 0) {
    start.setUTCDate(start.getUTCDate() - 1);
  }
  let streak = 0;
  const day = new Date(start);
  while ((counts[activityDayKey(day)] ?? 0) > 0) {
    streak += 1;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return streak;
}

/**
 * Activity counts per UTC day for the last `days` days — comments + watch +
 * list-add + forum posts + ratings. Used by the Activity History heatmap.
 */
export async function getCommentActivity(
  userId: string,
  days = 182,
): Promise<ActivityData> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const counts: Record<string, number> = {};
  const breakdown: Record<string, ActivityBreakdown> = {};
  try {
    const admin = createAdminClient();
    const [comments, events, forum, ratings] = await Promise.all([
      admin
        .from("comments")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", since.toISOString()),
      admin
        .from("activity_events")
        .select("day, kind")
        .eq("user_id", userId)
        .gte("day", since.toISOString().slice(0, 10)),
      admin
        .from("forum_posts")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", since.toISOString()),
      admin
        .from("ratings")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", since.toISOString()),
    ]);
    if (comments.error) throw comments.error;
    if (events.error) throw events.error;
    if (forum.error) throw forum.error;
    if (ratings.error) throw ratings.error;

    for (const row of comments.data ?? []) {
      addDay(counts, breakdown, activityDayKey(new Date(row.created_at as string)), "comments");
    }
    for (const row of events.data ?? []) {
      const kind = row.kind === "list_add" ? "list_add" : "watch";
      addDay(counts, breakdown, String(row.day), kind);
    }
    for (const row of forum.data ?? []) {
      addDay(counts, breakdown, activityDayKey(new Date(row.created_at as string)), "forum");
    }
    for (const row of ratings.data ?? []) {
      addDay(counts, breakdown, activityDayKey(new Date(row.created_at as string)), "rating");
    }

    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return { counts, breakdown, total, currentStreak: computeStreak(counts) };
  } catch (error) {
    console.error("getCommentActivity failed", error);
    return { counts: {}, breakdown: {}, total: 0, currentStreak: 0 };
  }
}
