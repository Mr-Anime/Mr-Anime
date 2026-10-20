"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getTitleUnlocks } from "@/lib/prefs-server";
import { AVATAR_SRC } from "@/lib/avatar-catalog";
import {
  BANNER_IDS,
  FLAIR_KEYS,
  TITLES,
  THEME_KEYS,
  userProfileSchema,
} from "@/lib/profile-prefs";

export type SavePrefsResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/** Save profile customization (avatar/banner/title/flair/badges/favorites/theme). */
export async function saveProfilePrefs(
  input: unknown,
): Promise<SavePrefsResult> {
  const parsed = userProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid customization payload." };
  }
  const prefs = parsed.data;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    const userId = authData?.claims?.sub;
    if (!userId) return { ok: false, error: "Sign in to customize your profile." };

    const limit = rateLimit(`prefs:${userId}`, { limit: 10, windowMs: 10 * 60_000 });
    if (!limit.ok) {
      return { ok: false, error: "Too many saves — try again shortly." };
    }

    // Catalog-only validation — custom/uploaded avatars are NOT allowed.
    if (prefs.avatarId !== "" && !(prefs.avatarId in AVATAR_SRC)) {
      return { ok: false, error: "That avatar is not in the catalog." };
    }
    if (!BANNER_IDS.includes(prefs.bannerId as never)) {
      return { ok: false, error: "Unknown banner." };
    }
    if (!THEME_KEYS.includes(prefs.theme)) {
      return { ok: false, error: "Unknown theme." };
    }
    const flair = prefs.flair.filter((f) => (FLAIR_KEYS as readonly string[]).includes(f)).slice(0, 6);
    const characters = [...new Set(prefs.characters)].filter((c) => c in AVATAR_SRC).slice(0, 3);

    // Title must actually be unlocked (server-side authority).
    let title: string | null = null;
    if (prefs.title) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("badges, nitro_until, role")
        .eq("id", userId)
        .single();
      const badges = (profile?.badges as string[] | null) ?? [];
      const nitro = profile?.nitro_until
        ? new Date(profile.nitro_until as string).getTime() > Date.now()
        : false;
      const { unlocked } = await getTitleUnlocks(userId, {
        badges,
        nitro,
        role: profile?.role ?? "user",
      });
      if (!unlocked.has(prefs.title)) {
        return { ok: false, error: "You have not unlocked that title yet." };
      }
      if (!TITLES.some((t) => t.key === prefs.title)) {
        return { ok: false, error: "Unknown title." };
      }
      title = prefs.title;
    }

    // Badge display: only badges the user actually owns.
    const { data: me } = await supabase
      .from("profiles")
      .select("badges")
      .eq("id", userId)
      .single();
    const owned = (me?.badges as string[] | null) ?? [];
    const displayBadges = prefs.displayBadges.filter((b) => owned.includes(b));

    const { error } = await supabase.from("profile_prefs").upsert(
      {
        user_id: userId,
        avatar_id: prefs.avatarId || null,
        banner_id: prefs.bannerId,
        title,
        flair,
        display_badges: displayBadges,
        characters,
        theme: prefs.theme,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) {
      console.error("[prefs] save failed", error.message);
      return { ok: false, error: "Could not save your customization. Try again." };
    }

    // Sync catalog avatar to profiles.avatar_url so every surface uses it.
    if (prefs.avatarId) {
      const src = AVATAR_SRC[prefs.avatarId];
      const { error: avatarErr } = await supabase
        .from("profiles")
        .update({ avatar_url: src })
        .eq("id", userId);
      if (avatarErr) console.error("[prefs] avatar sync failed", avatarErr.message);
    }

    revalidatePath("/customize");
    revalidatePath("/account");
    return { ok: true, message: "Profile customization saved!" };
  } catch (error) {
    console.error("[prefs] save failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
