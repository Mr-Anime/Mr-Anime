import "server-only";
import { tryCreateClient } from "@/lib/supabase/server";
import { getLoadouts } from "@/lib/loadouts";
import type { Cosmetics } from "@/lib/cosmetics";

export type ForumAuthor = {
  username: string;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  badges: string[] | null;
  nitro_until: string | null;
  cosmetics: Cosmetics | null;
};

export type ForumThread = {
  id: string;
  user_id: string;
  title: string;
  locked: boolean;
  created_at: string;
  author: ForumAuthor | null;
  replyCount: number;
};

export type ForumPost = {
  id: string;
  thread_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: ForumAuthor | null;
};

export type ForumViewer = {
  id: string;
  username: string;
  role: string;
};

const AUTHOR = "username, avatar_url, role, is_verified, badges, nitro_until";
const THREAD_PAGE_SIZE = 20;
const POST_PAGE_SIZE = 20;

/** Signed-in viewer's minimal profile, or null. */
export async function getForumViewer(): Promise<ForumViewer | null> {
  const supabase = await tryCreateClient();
  if (!supabase) return null;
  try {
    const { data: authData } = await supabase.auth.getClaims();
    const sub = authData?.claims?.sub;
    if (!sub) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, role")
      .eq("id", sub)
      .single();
    if (!profile) return null;
    return {
      id: profile.id as string,
      username: profile.username as string,
      role: profile.role as string,
    };
  } catch {
    return null;
  }
}

/** Paged thread list, newest first, with reply counts + author cosmetics. */
export async function listThreads(
  page = 1,
): Promise<{ threads: ForumThread[]; total: number; totalPages: number }> {
  const supabase = await tryCreateClient();
  if (!supabase) return { threads: [], total: 0, totalPages: 1 };

  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * THREAD_PAGE_SIZE;

  try {
    const { data, count, error } = await supabase
      .from("forum_threads")
      .select(
        `id, user_id, title, locked, created_at, author:profiles(${AUTHOR}), posts:forum_posts(count)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + THREAD_PAGE_SIZE - 1);
    if (error) throw error;

    type Row = {
      id: string;
      user_id: string;
      title: string;
      locked: boolean;
      created_at: string;
      author: Omit<ForumAuthor, "cosmetics"> | null;
      posts: { count: number | null }[];
    };
    const rows = (data ?? []) as unknown as Row[];

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const loadouts = await getLoadouts(userIds);

    const threads: ForumThread[] = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      locked: r.locked,
      created_at: r.created_at,
      author: r.author
        ? { ...r.author, cosmetics: loadouts.get(r.user_id) ?? null }
        : null,
      replyCount: r.posts?.[0]?.count ?? 0,
    }));

    const total = count ?? threads.length;
    return { threads, total, totalPages: Math.max(1, Math.ceil(total / THREAD_PAGE_SIZE)) };
  } catch (error) {
    console.error("[forum] listThreads failed", error);
    return { threads: [], total: 0, totalPages: 1 };
  }
}

/** One thread + a paged, ascending list of replies. */
export async function getThread(
  threadId: string,
  postPage = 1,
): Promise<{
  thread: (ForumThread & { body: string }) | null;
  posts: ForumPost[];
  totalPosts: number;
  totalPostPages: number;
}> {
  const supabase = await tryCreateClient();
  if (!supabase) return { thread: null, posts: [], totalPosts: 0, totalPostPages: 1 };

  const safePage = Math.max(1, postPage);
  const offset = (safePage - 1) * POST_PAGE_SIZE;

  try {
    const { data: threadRow, error } = await supabase
      .from("forum_threads")
      .select(`id, user_id, title, body, locked, created_at, author:profiles(${AUTHOR})`)
      .eq("id", threadId)
      .single();
    if (error || !threadRow) return { thread: null, posts: [], totalPosts: 0, totalPostPages: 1 };

    type TRow = {
      id: string;
      user_id: string;
      title: string;
      body: string;
      locked: boolean;
      created_at: string;
      author: Omit<ForumAuthor, "cosmetics"> | null;
    };
    const t = threadRow as unknown as TRow;

    const { data: postRows, count, error: postsError } = await supabase
      .from("forum_posts")
      .select(`id, thread_id, user_id, body, created_at, author:profiles(${AUTHOR})`, {
        count: "exact",
      })
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .range(offset, offset + POST_PAGE_SIZE - 1);
    if (postsError) throw postsError;

    type PRow = {
      id: string;
      thread_id: string;
      user_id: string;
      body: string;
      created_at: string;
      author: Omit<ForumAuthor, "cosmetics"> | null;
    };
    const rows = (postRows ?? []) as unknown as PRow[];

    const userIds = [...new Set([t.user_id, ...rows.map((r) => r.user_id)])];
    const loadouts = await getLoadouts(userIds);

    const totalPosts = count ?? rows.length;
    return {
      thread: {
        id: t.id,
        user_id: t.user_id,
        title: t.title,
        body: t.body,
        locked: t.locked,
        created_at: t.created_at,
        author: t.author
          ? { ...t.author, cosmetics: loadouts.get(t.user_id) ?? null }
          : null,
        replyCount: totalPosts,
      },
      posts: rows.map((r) => ({
        id: r.id,
        thread_id: r.thread_id,
        user_id: r.user_id,
        body: r.body,
        created_at: r.created_at,
        author: r.author
          ? { ...r.author, cosmetics: loadouts.get(r.user_id) ?? null }
          : null,
      })),
      totalPosts,
      totalPostPages: Math.max(1, Math.ceil(totalPosts / POST_PAGE_SIZE)),
    };
  } catch (error) {
    console.error("[forum] getThread failed", error);
    return { thread: null, posts: [], totalPosts: 0, totalPostPages: 1 };
  }
}
