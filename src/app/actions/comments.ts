"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { commentSchema } from "@/lib/validation";

export type CommentActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const commentIdSchema = z.uuid();

export async function postComment(
  anilistId: number,
  episode: number | null,
  content: string,
): Promise<CommentActionResult> {
  const ip = await clientIp();
  const ipLimit = rateLimit(`comment:${ip}`, { limit: 10, windowMs: 10 * 60_000 });
  if (!ipLimit.ok) {
    return { ok: false, error: "Too many comments — try again in a few minutes." };
  }

  const parsed = commentSchema.safeParse({ anilistId, episode, content });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    if (!authData?.claims?.sub) {
      return { ok: false, error: "Sign in to join the discussion." };
    }

    const userId = authData.claims.sub;
    const userLimit = rateLimit(`comment-user:${userId}`, {
      limit: 15,
      windowMs: 10 * 60_000,
    });
    if (!userLimit.ok) {
      return { ok: false, error: "You are commenting too fast — slow down a little." };
    }

    const { error } = await supabase.from("comments").insert({
      user_id: userId,
      anilist_id: parsed.data.anilistId,
      episode: parsed.data.episode,
      content: parsed.data.content,
    });
    if (error) {
      console.error("[comments] insert failed", error.message);
      return { ok: false, error: "Could not post your comment. Try again." };
    }

    revalidatePath(`/anime/${parsed.data.anilistId}`);
    if (parsed.data.episode !== null) {
      revalidatePath(`/watch/${parsed.data.anilistId}/${parsed.data.episode}`);
    }
    return { ok: true, message: "Comment posted." };
  } catch (error) {
    console.error("[comments] post failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

export async function deleteComment(commentId: string): Promise<CommentActionResult> {
  const parsedId = commentIdSchema.safeParse(commentId);
  if (!parsedId.success) return { ok: false, error: "Invalid comment." };

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    if (!authData?.claims?.sub) {
      return { ok: false, error: "Sign in first." };
    }

    // RLS only returns deleted rows the caller may remove (own or admin).
    const { data, error } = await supabase
      .from("comments")
      .delete()
      .eq("id", parsedId.data)
      .select("anilist_id, episode");
    if (error) {
      console.error("[comments] delete failed", error.message);
      return { ok: false, error: "Could not delete that comment. Try again." };
    }
    if (!data || data.length === 0) {
      return { ok: false, error: "You can only delete your own comments." };
    }

    const row = data[0];
    revalidatePath(`/anime/${row.anilist_id}`);
    if (row.episode !== null) {
      revalidatePath(`/watch/${row.anilist_id}/${row.episode}`);
    }
    return { ok: true, message: "Comment deleted." };
  } catch (error) {
    console.error("[comments] delete failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
