"use server";

import { revalidatePath } from "next/cache";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { ListStatus } from "@/lib/list-shared";
import {
  listAnilistIdSchema,
  listProgressSchema,
  listStatusSchema,
  markWatchedSchema,
} from "@/lib/validation";

export type ListActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

type Guard =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; error: string };

async function guard(): Promise<Guard> {
  const ip = await clientIp();
  const ipLimit = rateLimit(`list:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!ipLimit.ok) {
    return { ok: false, error: "Too many list updates — wait a minute and try again." };
  }

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    const userId = authData?.claims?.sub;
    if (!userId) return { ok: false, error: "Sign in to use your list." };

    const userLimit = rateLimit(`list-user:${userId}`, {
      limit: 60,
      windowMs: 60_000,
    });
    if (!userLimit.ok) {
      return { ok: false, error: "You are updating your list too fast." };
    }
    return { ok: true, supabase, userId };
  } catch (error) {
    console.error("[list] guard failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

function revalidateFor(anilistId: number) {
  revalidatePath("/list");
  revalidatePath(`/anime/${anilistId}`);
}

/** Add an anime to the list, or change an existing entry's status. */
export async function setListStatus(
  anilistId: number,
  status: string,
): Promise<ListActionResult> {
  const g = await guard();
  if (!g.ok) return g;

  const id = listAnilistIdSchema.safeParse(anilistId);
  const st = listStatusSchema.safeParse(status);
  if (!id.success || !st.success) return { ok: false, error: "Invalid list update." };

  try {
    // Upsert on (user_id, anilist_id): creates with default episodes_watched = 0,
    // updates only status + updated_at on conflict (payload columns only).
    const { error } = await g.supabase.from("user_list_entries").upsert(
      {
        user_id: g.userId,
        anilist_id: id.data,
        status: st.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,anilist_id" },
    );
    if (error) {
      console.error("[list] set status failed", error.message);
      return { ok: false, error: "Could not update your list. Try again." };
    }
    revalidateFor(id.data);
    return { ok: true, message: "List updated." };
  } catch (error) {
    console.error("[list] set status failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

/** Set how many episodes the user has watched (never lowers below 0). */
export async function setListProgress(
  anilistId: number,
  episodesWatched: number,
): Promise<ListActionResult> {
  const g = await guard();
  if (!g.ok) return g;

  const parsed = listProgressSchema.safeParse({ anilistId, episodesWatched });
  if (!parsed.success) return { ok: false, error: "Invalid episode count." };

  try {
    const { error } = await g.supabase.from("user_list_entries").upsert(
      {
        user_id: g.userId,
        anilist_id: parsed.data.anilistId,
        episodes_watched: parsed.data.episodesWatched,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,anilist_id" },
    );
    if (error) {
      console.error("[list] set progress failed", error.message);
      return { ok: false, error: "Could not update your progress. Try again." };
    }
    revalidateFor(parsed.data.anilistId);
    return { ok: true, message: "Progress saved." };
  } catch (error) {
    console.error("[list] set progress failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

/**
 * Mark an episode as watched from the watch page.
 * Progress = max(current, episode); status stays (planning → watching);
 * reaching the final episode sets completed.
 */
export async function markEpisodeWatched(
  anilistId: number,
  episode: number,
  total: number,
): Promise<ListActionResult> {
  const g = await guard();
  if (!g.ok) return g;

  const id = listAnilistIdSchema.safeParse(anilistId);
  const ep = markWatchedSchema.shape.episode.safeParse(episode);
  const tt = markWatchedSchema.shape.total.safeParse(total);
  if (!id.success || !ep.success || !tt.success) {
    return { ok: false, error: "Invalid episode." };
  }
  const episodeN = ep.data;
  const totalN = tt.data;

  try {
    const { data: existing, error: readError } = await g.supabase
      .from("user_list_entries")
      .select("status, episodes_watched")
      .eq("user_id", g.userId)
      .eq("anilist_id", id.data)
      .maybeSingle();
    if (readError) {
      console.error("[list] mark watched read failed", readError.message);
      return { ok: false, error: "Could not update your progress. Try again." };
    }

    const reachedEnd = totalN > 0 && episodeN >= totalN;
    let status: ListStatus = existing
      ? (existing.status as ListStatus)
      : reachedEnd
        ? "completed"
        : "watching";
    if (existing && status === "planning") status = reachedEnd ? "completed" : "watching";
    if (reachedEnd) status = "completed";

    const episodesWatched = Math.max(
      Number(existing?.episodes_watched ?? 0) || 0,
      episodeN,
    );
    const now = new Date().toISOString();

    if (existing) {
      const { error } = await g.supabase
        .from("user_list_entries")
        .update({ status, episodes_watched: episodesWatched, updated_at: now })
        .eq("user_id", g.userId)
        .eq("anilist_id", id.data);
      if (error) {
        console.error("[list] mark watched update failed", error.message);
        return { ok: false, error: "Could not update your progress. Try again." };
      }
    } else {
      const { error } = await g.supabase.from("user_list_entries").insert({
        user_id: g.userId,
        anilist_id: id.data,
        status,
        episodes_watched: episodesWatched,
        updated_at: now,
      });
      if (error) {
        console.error("[list] mark watched insert failed", error.message);
        return { ok: false, error: "Could not update your progress. Try again." };
      }
    }

    revalidateFor(id.data);
    revalidatePath(`/watch/${id.data}/${episodeN}`);
    return {
      ok: true,
      message: reachedEnd
        ? "Series completed — nice!"
        : `Episode ${episodeN} marked as watched.`,
    };
  } catch (error) {
    console.error("[list] mark watched failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

/** Remove an anime from the user's list. */
export async function removeListEntry(anilistId: number): Promise<ListActionResult> {
  const g = await guard();
  if (!g.ok) return g;

  const id = listAnilistIdSchema.safeParse(anilistId);
  if (!id.success) return { ok: false, error: "Invalid list entry." };

  try {
    // RLS only allows deleting the caller's own rows.
    const { data, error } = await g.supabase
      .from("user_list_entries")
      .delete()
      .eq("user_id", g.userId)
      .eq("anilist_id", id.data)
      .select("anilist_id");
    if (error) {
      console.error("[list] remove failed", error.message);
      return { ok: false, error: "Could not remove that entry. Try again." };
    }
    if (!data || data.length === 0) {
      return { ok: false, error: "That anime is not on your list." };
    }
    revalidateFor(id.data);
    return { ok: true, message: "Removed from your list." };
  } catch (error) {
    console.error("[list] remove failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
