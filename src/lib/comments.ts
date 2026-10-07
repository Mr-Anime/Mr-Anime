import "server-only";
import { tryCreateClient } from "@/lib/supabase/server";
import type { CommentView, CommentViewer } from "@/lib/comments-shared";

export type { CommentAuthor, CommentView, CommentViewer } from "@/lib/comments-shared";

const SELECT =
  "id, user_id, content, created_at, profiles(username, avatar_url, role, is_verified, badges)";

/** Public comment thread for one anime (episode = null) or one episode. */
export async function getComments(
  anilistId: number,
  episode: number | null,
): Promise<CommentView[]> {
  const supabase = await tryCreateClient();
  if (!supabase) return [];

  try {
    let query = supabase
      .from("comments")
      .select(SELECT)
      .eq("anilist_id", anilistId)
      .order("created_at", { ascending: false })
      .limit(100);
    query = episode === null ? query.is("episode", null) : query.eq("episode", episode);

    const { data, error } = await query;
    if (error) {
      console.error("[comments] query failed", error.message);
      return [];
    }
    return (data ?? []) as unknown as CommentView[];
  } catch (error) {
    console.error("[comments] query failed", error);
    return [];
  }
}

/** The signed-in viewer's profile, or null when signed out / unconfigured. */
export async function getCommentViewer(): Promise<CommentViewer | null> {
  const supabase = await tryCreateClient();
  if (!supabase) return null;

  try {
    const { data: authData } = await supabase.auth.getClaims();
    const sub = authData?.claims?.sub;
    if (!sub) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, role")
      .eq("id", sub)
      .single();
    if (!profile) return null;
    return {
      id: profile.id as string,
      username: profile.username as string,
      avatar_url: (profile.avatar_url as string | null) ?? null,
      role: profile.role as string,
    };
  } catch (error) {
    console.error("[comments] viewer lookup failed", error);
    return null;
  }
}
