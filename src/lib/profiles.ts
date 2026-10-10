import "server-only";
import { tryCreateClient } from "@/lib/supabase/server";

export type PublicProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  badges: string[];
  nitro_until: string | null;
  created_at: string;
};

export type ProfileComment = {
  id: string;
  content: string;
  created_at: string;
  anilist_id: number;
  episode: number | null;
};

const PROFILE_COLUMNS = "id, username, avatar_url, role, is_verified, badges, nitro_until, created_at";

/** Public profile by username (profiles are column-readable by anon). */
export async function getProfileByUsername(
  username: string,
): Promise<PublicProfile | null> {
  const supabase = await tryCreateClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("username", username)
      .maybeSingle();
    if (error) {
      console.error("[profile] lookup failed", error.message);
      return null;
    }
    return (data as unknown as PublicProfile) ?? null;
  } catch (error) {
    console.error("[profile] lookup failed", error);
    return null;
  }
}

/** A user's most recent public comments (for their profile page). */
export async function getRecentComments(userId: string): Promise<ProfileComment[]> {
  const supabase = await tryCreateClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("comments")
      .select("id, content, created_at, anilist_id, episode")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("[profile] comments query failed", error.message);
      return [];
    }
    return (data ?? []) as unknown as ProfileComment[];
  } catch (error) {
    console.error("[profile] comments query failed", error);
    return [];
  }
}
