import "server-only";
import { AVATAR_SRC } from "@/lib/avatar-catalog";
import {
  BANNER_IDS,
  DEFAULT_PREFS,
  FLAIR_KEYS,
  THEME_KEYS,
  TITLES,
  type TitleRule,
  type UserProfile,
} from "@/lib/profile-prefs";
import { createClient } from "@/lib/supabase/server";

type PrefsRow = {
  avatar_id: string | null;
  banner_id: string | null;
  title: string | null;
  flair: string[];
  display_badges: string[];
  characters: string[];
  theme: string;
};

function toPrefs(row: PrefsRow | null): UserProfile {
  if (!row) return { ...DEFAULT_PREFS };

  // Normalize legacy / stale values so an unrelated old id never blocks saving.
  const avatarId = row.avatar_id && row.avatar_id in AVATAR_SRC ? row.avatar_id : "";
  const bannerId =
    row.banner_id && (BANNER_IDS as readonly string[]).includes(row.banner_id)
      ? row.banner_id
      : "classic";
  const title = row.title && TITLES.some((t) => t.key === row.title) ? row.title : null;
  const flair = (Array.isArray(row.flair) ? row.flair : [])
    .filter((key) => (FLAIR_KEYS as readonly string[]).includes(key))
    .slice(0, 6);
  const displayBadges = (Array.isArray(row.display_badges) ? row.display_badges : []).slice(0, 30);
  const characters = (Array.isArray(row.characters) ? row.characters : [])
    .filter((id) => id in AVATAR_SRC)
    .slice(0, 3);
  const theme = (THEME_KEYS as readonly string[]).includes(row.theme)
    ? (row.theme as UserProfile["theme"])
    : "classic";

  return {
    avatarId,
    bannerId,
    title,
    flair,
    displayBadges,
    characters,
    theme,
  };
}

/** Fetch saved customization (defaults when no row / table missing). */
export async function getProfilePrefs(userId: string): Promise<UserProfile> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profile_prefs")
      .select("avatar_id, banner_id, title, flair, display_badges, characters, theme")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return toPrefs((data as PrefsRow | null) ?? null);
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export type TitleUnlock = {
  unlocked: Set<string>;
  points: number;
  counts: { list: number; watched: number; comments: number; ratings: number; forum: number };
};

async function countRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  userId: string,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Compute watch points + which titles the viewer has earned. */
export async function getTitleUnlocks(
  userId: string,
  ctx: { badges: string[]; nitro: boolean; role: string },
): Promise<TitleUnlock> {
  let counts = { list: 0, watched: 0, comments: 0, ratings: 0, forum: 0 };
  try {
    const supabase = await createClient();
    const [list, watched, comments, ratings, forum] = await Promise.all([
      countRows(supabase, "user_list_entries", userId),
      countRows(supabase, "watch_progress", userId),
      countRows(supabase, "comments", userId),
      countRows(supabase, "ratings", userId),
      countRows(supabase, "forum_posts", userId),
    ]);
    counts = { list, watched, comments, ratings, forum };
  } catch {
    // Unconfigured — everything stays at zero, only free titles unlock.
  }
  const points = counts.watched * 2 + counts.comments;

  const satisfied = (rule: TitleRule): boolean => {
    switch (rule.kind) {
      case "free":
        return true;
      case "list":
        return counts.list >= rule.min;
      case "watched":
        return counts.watched >= rule.min;
      case "points":
        return points >= rule.min;
      case "ratings":
        return counts.ratings >= rule.min;
      case "forum":
        return counts.forum >= rule.min;
      case "badge":
        return ctx.badges.includes(rule.badge);
      case "nitro":
        return ctx.nitro;
      case "staff":
        return ctx.role === "admin" || ctx.role === "moderator";
    }
  };

  const unlocked = new Set(TITLES.filter((t) => satisfied(t.rule)).map((t) => t.key));
  return { unlocked, points, counts };
}
