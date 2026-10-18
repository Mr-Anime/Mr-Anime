import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Milestone achievements — computed live from stats, no extra state. */

export type AchievementKey =
  | "first-comment"
  | "chatterbox"
  | "binge-starter"
  | "binge-master"
  | "supporter"
  | "streak-7"
  | "collector";

export type Achievement = {
  key: AchievementKey;
  title: string;
  description: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: "first-comment",
    title: "First Words",
    description: "Post your first comment.",
  },
  {
    key: "chatterbox",
    title: "Chatterbox",
    description: "Post 100 comments.",
  },
  {
    key: "binge-starter",
    title: "Binge Starter",
    description: "Watch 10 episodes.",
  },
  {
    key: "binge-master",
    title: "Binge Master",
    description: "Watch 50 episodes.",
  },
  {
    key: "supporter",
    title: "Supporter",
    description: "Make a paid donation.",
  },
  {
    key: "streak-7",
    title: "Committed",
    description: "Reach a 7-day daily reward streak.",
  },
  {
    key: "collector",
    title: "Collector",
    description: "Own 5+ shop items.",
  },
];

export type ProfileStats = {
  comments: number;
  episodes: number;
  forumPosts: number;
  donations: number;
  longestStreak: number;
  ownedItems: number;
};

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const stats: ProfileStats = {
    comments: 0,
    episodes: 0,
    forumPosts: 0,
    donations: 0,
    longestStreak: 0,
    ownedItems: 0,
  };
  try {
    const admin = createAdminClient();
    const [comments, episodes, forumPosts, donations, streak, items] =
      await Promise.all([
        admin
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        admin
          .from("watch_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        admin
          .from("forum_posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        admin
          .from("donations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "Paid"),
        admin.from("streaks").select("longest_streak").eq("user_id", userId).maybeSingle(),
        admin
          .from("user_items")
          .select("item_id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

    stats.comments = comments.count ?? 0;
    stats.episodes = episodes.count ?? 0;
    stats.forumPosts = forumPosts.count ?? 0;
    stats.donations = donations.count ?? 0;
    stats.longestStreak = Number(streak.data?.longest_streak ?? 0);
    stats.ownedItems = items.count ?? 0;
  } catch (error) {
    console.error("[achievements] stats failed", error);
  }
  return stats;
}

/** Which achievements the given stats satisfy. */
export function earnedAchievements(stats: ProfileStats): Set<AchievementKey> {
  const earned = new Set<AchievementKey>();
  if (stats.comments >= 1) earned.add("first-comment");
  if (stats.comments >= 100) earned.add("chatterbox");
  if (stats.episodes >= 10) earned.add("binge-starter");
  if (stats.episodes >= 50) earned.add("binge-master");
  if (stats.donations >= 1) earned.add("supporter");
  if (stats.longestStreak >= 7) earned.add("streak-7");
  if (stats.ownedItems >= 5) earned.add("collector");
  return earned;
}
