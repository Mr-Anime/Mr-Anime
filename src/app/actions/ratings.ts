"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type RatingActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const ratingSchema = z.object({
  anilistId: z.int().positive(),
  score: z.int().min(0).max(5),
});

/** Set (1–5) or remove (0) the viewer's community rating. */
export async function setRating(
  anilistId: number,
  score: number,
): Promise<RatingActionResult> {
  const parsed = ratingSchema.safeParse({ anilistId, score });
  if (!parsed.success) return { ok: false, error: "Invalid rating." };

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    const sub = authData?.claims?.sub;
    if (!sub) return { ok: false, error: "Sign in to rate anime." };

    if (parsed.data.score === 0) {
      const { error } = await supabase
        .from("ratings")
        .delete()
        .eq("user_id", sub)
        .eq("anilist_id", parsed.data.anilistId);
      if (error) {
        console.error("[ratings] delete failed", error.message);
        return { ok: false, error: "Could not update your rating." };
      }
    } else {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("ratings")
        .upsert(
          {
            user_id: sub,
            anilist_id: parsed.data.anilistId,
            score: parsed.data.score,
            updated_at: now,
          },
          { onConflict: "user_id,anilist_id" },
        );
      if (error) {
        console.error("[ratings] upsert failed", error.message);
        return { ok: false, error: "Could not save your rating." };
      }
    }

    revalidatePath(`/anime/${parsed.data.anilistId}`);
    return { ok: true, message: "Rating saved." };
  } catch (error) {
    console.error("[ratings] failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
