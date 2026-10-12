"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MOD_VERIFIED_BADGE } from "@/lib/badges";
import { moderatorGate } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type ModeratorActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const targetIdSchema = z.uuid();

async function audit(
  actorId: string,
  targetUserId: string | null,
  action: string,
  details: Record<string, unknown>,
) {
  try {
    const client = createAdminClient();
    await client.from("admin_actions").insert({
      admin_id: actorId,
      target_user_id: targetUserId,
      action,
      details,
    });
  } catch (error) {
    // Audit failures must not block the action, but must be visible.
    console.error("[moderator] audit write failed", error);
  }
}

async function requireModerator(): Promise<
  { moderatorId: string } | { error: ModeratorActionResult }
> {
  const gate = await moderatorGate();
  if (gate.status !== "ok") {
    return { error: { ok: false, error: "Not authorized." } };
  }
  return { moderatorId: gate.adminId };
}

/** Grant or revoke the Moderator Verified badge from the moderator panel. */
export async function setModVerified(
  targetId: string,
  enabled: boolean,
): Promise<ModeratorActionResult> {
  const auth = await requireModerator();
  if ("error" in auth) return auth.error;

  const idParsed = targetIdSchema.safeParse(targetId);
  if (!idParsed.success) return { ok: false, error: "Invalid user id." };
  if (idParsed.data === auth.moderatorId) {
    return { ok: false, error: "You cannot verify your own account." };
  }

  try {
    const client = createAdminClient();
    const { data: target } = await client
      .from("profiles")
      .select("id, username, badges")
      .eq("id", targetId)
      .single();
    if (!target) return { ok: false, error: "User not found." };

    const current = Array.isArray(target.badges) ? target.badges : [];
    const has = current.includes(MOD_VERIFIED_BADGE);
    if (has === enabled) {
      return {
        ok: false,
        error: enabled
          ? "That badge is already granted."
          : "That badge is not granted.",
      };
    }
    const badges = enabled
      ? [...current, MOD_VERIFIED_BADGE]
      : current.filter((key) => key !== MOD_VERIFIED_BADGE);

    const { error } = await client
      .from("profiles")
      .update({ badges })
      .eq("id", targetId);
    if (error) return { ok: false, error: error.message };

    await audit(
      auth.moderatorId,
      targetId,
      enabled ? "grant_badge" : "revoke_badge",
      {
        username: target.username,
        badge: MOD_VERIFIED_BADGE,
        by: "moderator",
      },
    );
    revalidatePath("/moderator");
    revalidatePath("/admin/users");
    return {
      ok: true,
      message: enabled
        ? `${target.username} is now moderator verified.`
        : `Moderator verification removed from ${target.username}.`,
    };
  } catch (error) {
    console.error("[moderator] setModVerified failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
