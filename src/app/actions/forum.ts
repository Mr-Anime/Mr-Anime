"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type ForumActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string };

const threadIdSchema = z.uuid();
const postIdSchema = z.uuid();
const titleSchema = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters.")
  .max(120, "Title must be 120 characters or fewer.");
const threadBodySchema = z
  .string()
  .trim()
  .min(1, "Write something.")
  .max(10000, "Body must be 10000 characters or fewer.");
const postBodySchema = z
  .string()
  .trim()
  .min(1, "Write a reply.")
  .max(8000, "Reply must be 8000 characters or fewer.");

async function requireUser(): Promise<
  { userId: string; role: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { error: string }
> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const sub = authData?.claims?.sub;
  if (!sub) return { error: "Sign in first." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_banned")
    .eq("id", sub)
    .single();
  if (!profile) return { error: "Profile not found." };
  if (profile.is_banned) return { error: "Your account is banned." };
  return { userId: profile.id as string, role: profile.role as string, supabase };
}

export async function createThread(
  title: string,
  body: string,
): Promise<ForumActionResult> {
  const ip = await clientIp();
  const ipLimit = rateLimit(`forum-thread:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!ipLimit.ok) {
    return { ok: false, error: "Too many threads — try again in a few minutes." };
  }

  const parsed = z
    .object({ title: titleSchema, body: threadBodySchema })
    .safeParse({ title, body });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid thread." };
  }

  try {
    const auth = await requireUser();
    if ("error" in auth) return { ok: false, error: auth.error };

    const { supabase, userId } = auth;
    const userLimit = rateLimit(`forum-thread-user:${userId}`, {
      limit: 5,
      windowMs: 10 * 60_000,
    });
    if (!userLimit.ok) {
      return { ok: false, error: "You are creating threads too fast — slow down." };
    }

    const { data, error } = await supabase
      .from("forum_threads")
      .insert({ user_id: userId, title: parsed.data.title, body: parsed.data.body })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[forum] createThread failed", error?.message);
      return { ok: false, error: "Could not create the thread. Try again." };
    }

    revalidatePath("/forum");
    return { ok: true, message: "Thread created.", id: data.id as string };
  } catch (error) {
    console.error("[forum] createThread failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

export async function createPost(
  threadId: string,
  body: string,
): Promise<ForumActionResult> {
  const ip = await clientIp();
  const ipLimit = rateLimit(`forum-post:${ip}`, { limit: 20, windowMs: 10 * 60_000 });
  if (!ipLimit.ok) {
    return { ok: false, error: "Too many replies — try again in a few minutes." };
  }

  const parsed = z
    .object({ threadId: threadIdSchema, body: postBodySchema })
    .safeParse({ threadId, body });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid reply." };
  }

  try {
    const auth = await requireUser();
    if ("error" in auth) return { ok: false, error: auth.error };

    const { supabase, userId } = auth;
    const userLimit = rateLimit(`forum-post-user:${userId}`, {
      limit: 20,
      windowMs: 10 * 60_000,
    });
    if (!userLimit.ok) {
      return { ok: false, error: "You are replying too fast — slow down." };
    }

    // Public select — thread state must be checked before insert (RLS
    // insert policy only verifies ownership, not the lock flag).
    const { data: thread } = await supabase
      .from("forum_threads")
      .select("id, locked")
      .eq("id", parsed.data.threadId)
      .single();
    if (!thread) return { ok: false, error: "Thread not found." };
    if (thread.locked) return { ok: false, error: "This thread is locked." };

    const { error } = await supabase
      .from("forum_posts")
      .insert({
        thread_id: parsed.data.threadId,
        user_id: userId,
        body: parsed.data.body,
      });
    if (error) {
      console.error("[forum] createPost failed", error.message);
      return { ok: false, error: "Could not post your reply. Try again." };
    }

    revalidatePath(`/forum/${parsed.data.threadId}`);
    return { ok: true, message: "Reply posted." };
  } catch (error) {
    console.error("[forum] createPost failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

export async function deleteThread(threadId: string): Promise<ForumActionResult> {
  const parsedId = threadIdSchema.safeParse(threadId);
  if (!parsedId.success) return { ok: false, error: "Invalid thread." };

  try {
    const auth = await requireUser();
    if ("error" in auth) return { ok: false, error: auth.error };

    // RLS only returns rows the caller may remove (own, or mod/admin).
    const { data, error } = await auth.supabase
      .from("forum_threads")
      .delete()
      .eq("id", parsedId.data)
      .select("id");
    if (error) {
      console.error("[forum] deleteThread failed", error.message);
      return { ok: false, error: "Could not delete that thread. Try again." };
    }
    if (!data || data.length === 0) {
      return { ok: false, error: "You can only delete your own threads." };
    }

    revalidatePath("/forum");
    return { ok: true, message: "Thread deleted." };
  } catch (error) {
    console.error("[forum] deleteThread failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

export async function deletePost(postId: string): Promise<ForumActionResult> {
  const parsedId = postIdSchema.safeParse(postId);
  if (!parsedId.success) return { ok: false, error: "Invalid reply." };

  try {
    const auth = await requireUser();
    if ("error" in auth) return { ok: false, error: auth.error };

    const { data, error } = await auth.supabase
      .from("forum_posts")
      .delete()
      .eq("id", parsedId.data)
      .select("thread_id");
    if (error) {
      console.error("[forum] deletePost failed", error.message);
      return { ok: false, error: "Could not delete that reply. Try again." };
    }
    if (!data || data.length === 0) {
      return { ok: false, error: "You can only delete your own replies." };
    }

    const row = data[0];
    revalidatePath(`/forum/${row.thread_id}`);
    return { ok: true, message: "Reply deleted." };
  } catch (error) {
    console.error("[forum] deletePost failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

export async function setThreadLocked(
  threadId: string,
  locked: boolean,
): Promise<ForumActionResult> {
  const parsedId = threadIdSchema.safeParse(threadId);
  if (!parsedId.success) return { ok: false, error: "Invalid thread." };

  try {
    const auth = await requireUser();
    if ("error" in auth) return { ok: false, error: auth.error };
    if (auth.role !== "admin" && auth.role !== "moderator") {
      return { ok: false, error: "Moderator access required." };
    }

    // RLS update policy only admits mod/admin callers.
    const { data, error } = await auth.supabase
      .from("forum_threads")
      .update({ locked })
      .eq("id", parsedId.data)
      .select("id");
    if (error) {
      console.error("[forum] setThreadLocked failed", error.message);
      return { ok: false, error: "Could not update the thread. Try again." };
    }
    if (!data || data.length === 0) {
      return { ok: false, error: "Could not update the thread." };
    }

    revalidatePath(`/forum/${parsedId.data}`);
    revalidatePath("/forum");
    return { ok: true, message: locked ? "Thread locked." : "Thread unlocked." };
  } catch (error) {
    console.error("[forum] setThreadLocked failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
