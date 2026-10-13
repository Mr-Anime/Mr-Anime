"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ADMIN_GRANTABLE_BADGES } from "@/lib/badges";
import { adminGate } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const targetIdSchema = z.uuid();
const roleSchema = z.enum(["user", "moderator", "admin"]);

async function audit(
  adminId: string,
  targetUserId: string | null,
  action: string,
  details: Record<string, unknown>,
) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_actions").insert({
      admin_id: adminId,
      target_user_id: targetUserId,
      action,
      details,
    });
  } catch (error) {
    // Audit failures must not block the action, but must be visible.
    console.error("[admin] audit write failed", error);
  }
}

async function requireAdmin(): Promise<
  { adminId: string } | { error: AdminActionResult }
> {
  const gate = await adminGate();
  if (gate.status !== "ok") {
    return { error: { ok: false, error: "Not authorized." } };
  }
  return { adminId: gate.adminId };
}

async function loadTargetProfile(targetId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, username, role, is_banned, is_verified, badges")
    .eq("id", targetId)
    .single();
  return data as {
    id: string;
    username: string;
    role: string;
    is_banned: boolean;
    is_verified: boolean;
    badges: string[];
  } | null;
}

async function countAdmins(excludeId?: string): Promise<number> {
  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (excludeId) query = query.neq("id", excludeId);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function setUserBan(
  targetId: string,
  banned: boolean,
  reason?: string,
): Promise<AdminActionResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const idParsed = targetIdSchema.safeParse(targetId);
  if (!idParsed.success) return { ok: false, error: "Invalid user id." };
  if (idParsed.data === auth.adminId) {
    return { ok: false, error: "You cannot ban your own account." };
  }

  try {
    const target = await loadTargetProfile(idParsed.data);
    if (!target) return { ok: false, error: "User not found." };

    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({
        is_banned: banned,
        ban_reason: banned ? (reason?.slice(0, 500) ?? "No reason given") : null,
      })
      .eq("id", targetId);
    if (error) return { ok: false, error: error.message };

    await audit(auth.adminId, targetId, banned ? "ban" : "unban", {
      username: target.username,
      reason: banned ? (reason ?? null) : null,
    });
    revalidatePath("/admin/users");
    return {
      ok: true,
      message: banned
        ? `${target.username} has been banned.`
        : `${target.username} has been unbanned.`,
    };
  } catch (error) {
    console.error("[admin] setUserBan failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

export async function setUserRole(
  targetId: string,
  role: "user" | "moderator" | "admin",
): Promise<AdminActionResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const idParsed = targetIdSchema.safeParse(targetId);
  const roleParsed = roleSchema.safeParse(role);
  if (!idParsed.success || !roleParsed.success) {
    return { ok: false, error: "Invalid input." };
  }
  if (idParsed.data === auth.adminId) {
    return { ok: false, error: "You cannot change your own role." };
  }

  try {
    const target = await loadTargetProfile(idParsed.data);
    if (!target) return { ok: false, error: "User not found." };

    if (roleParsed.data !== "admin" && target.role === "admin") {
      const others = await countAdmins(targetId);
      if (others === 0) {
        return { ok: false, error: "This is the last admin — promotion required first." };
      }
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ role: roleParsed.data })
      .eq("id", targetId);
    if (error) return { ok: false, error: error.message };

    const isPromotion =
      roleParsed.data === "admin" ||
      (roleParsed.data === "moderator" && target.role === "user");
    await audit(auth.adminId, targetId, isPromotion ? "promote" : "demote", {
      username: target.username,
      from: target.role,
      to: roleParsed.data,
    });
    revalidatePath("/admin/users");
    return {
      ok: true,
      message:
        roleParsed.data === "admin"
          ? `${target.username} is now an admin.`
          : roleParsed.data === "moderator"
            ? `${target.username} is now a moderator.`
            : `${target.username} is now a regular user.`,
    };
  } catch (error) {
    console.error("[admin] setUserRole failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

export async function setUserVerified(
  targetId: string,
  verified: boolean,
): Promise<AdminActionResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const idParsed = targetIdSchema.safeParse(targetId);
  if (!idParsed.success) return { ok: false, error: "Invalid user id." };
  if (idParsed.data === auth.adminId) {
    return { ok: false, error: "You cannot change your own verification." };
  }

  try {
    const target = await loadTargetProfile(idParsed.data);
    if (!target) return { ok: false, error: "User not found." };

    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ is_verified: verified })
      .eq("id", targetId);
    if (error) return { ok: false, error: error.message };

    await audit(auth.adminId, targetId, verified ? "verify" : "unverify", {
      username: target.username,
    });
    revalidatePath("/admin/users");
    return {
      ok: true,
      message: verified
        ? `${target.username} is now Owner verified.`
        : `Owner verification removed from ${target.username}.`,
    };
  } catch (error) {
    console.error("[admin] setUserVerified failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

/** Grant or revoke an admin-grantable badge (e.g. the verified icon for
 *  normal users). Only keys in ADMIN_GRANTABLE_BADGES are accepted. */
export async function setUserBadge(
  targetId: string,
  badge: string,
  enabled: boolean,
): Promise<AdminActionResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const idParsed = targetIdSchema.safeParse(targetId);
  const badgeParsed = z.enum(ADMIN_GRANTABLE_BADGES).safeParse(badge);
  if (!idParsed.success || !badgeParsed.success) {
    return { ok: false, error: "Invalid input." };
  }
  if (idParsed.data === auth.adminId) {
    return { ok: false, error: "You cannot change your own badges." };
  }

  try {
    const target = await loadTargetProfile(idParsed.data);
    if (!target) return { ok: false, error: "User not found." };

    const current = Array.isArray(target.badges) ? target.badges : [];
    const has = current.includes(badgeParsed.data);
    if (has === enabled) {
      return {
        ok: false,
        error: enabled
          ? "That badge is already granted."
          : "That badge is not granted.",
      };
    }
    const badges = enabled
      ? [...current, badgeParsed.data]
      : current.filter((key) => key !== badgeParsed.data);

    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ badges })
      .eq("id", targetId);
    if (error) return { ok: false, error: error.message };

    await audit(auth.adminId, targetId, enabled ? "grant_badge" : "revoke_badge", {
      username: target.username,
      badge: badgeParsed.data,
    });
    revalidatePath("/admin/users");
    return {
      ok: true,
      message: enabled
        ? `Badge granted to ${target.username}.`
        : `Badge removed from ${target.username}.`,
    };
  } catch (error) {
    console.error("[admin] setUserBadge failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

export async function deleteAccount(targetId: string): Promise<AdminActionResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const idParsed = targetIdSchema.safeParse(targetId);
  if (!idParsed.success) return { ok: false, error: "Invalid user id." };
  if (idParsed.data === auth.adminId) {
    return { ok: false, error: "You cannot delete your own account." };
  }

  try {
    const target = await loadTargetProfile(idParsed.data);
    if (!target) return { ok: false, error: "User not found." };

    if (target.role === "admin") {
      const others = await countAdmins(targetId);
      if (others === 0) {
        return { ok: false, error: "Cannot delete the last admin account." };
      }
    }

    // Audit first — the FK sets target_user_id to null on delete, details keep the name.
    await audit(auth.adminId, targetId, "delete_user", { username: target.username });

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(targetId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/users");
    return { ok: true, message: `${target.username} has been deleted.` };
  } catch (error) {
    console.error("[admin] deleteAccount failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

const adsSettingsSchema = z.object({
  banner: z.boolean(),
  social: z.boolean(),
});

/** Enable/disable site-wide ad placements (banner + social/popunder). */
export async function setAdsSettings(input: {
  banner: boolean;
  social: boolean;
}): Promise<AdminActionResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = adsSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  try {
    const admin = createAdminClient();
    const rows = [
      { key: "ads.banner", value: { enabled: parsed.data.banner }, updated_at: new Date().toISOString() },
      { key: "ads.social", value: { enabled: parsed.data.social }, updated_at: new Date().toISOString() },
    ];
    for (const row of rows) {
      const { error } = await admin.from("site_settings").upsert(row);
      if (error) return { ok: false, error: error.message };
    }

    await audit(auth.adminId, null, "ads_settings", {
      banner: parsed.data.banner,
      social: parsed.data.social,
    });
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: parsed.data.banner || parsed.data.social
        ? "Ad settings saved — placements are live."
        : "Ad settings saved — all ads disabled.",
    };
  } catch (error) {
    console.error("[admin] setAdsSettings failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

const sendNotificationSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().max(300).default(""),
  target: z.enum(["all", "user"]),
  username: z.string().trim().min(3).max(20).optional(),
});

/** Broadcast an admin notification to every user, or send it to one user. */
export async function sendNotification(input: {
  title: string;
  body?: string;
  target: "all" | "user";
  username?: string;
}): Promise<AdminActionResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = sendNotificationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Title must be 1–80 chars, message at most 300." };
  }
  const { title, body, target, username } = parsed.data;
  if (target === "user" && !username) {
    return { ok: false, error: "Enter a username." };
  }

  try {
    const admin = createAdminClient();
    let userIds: string[];

    if (target === "all") {
      const { data, error } = await admin.from("profiles").select("id");
      if (error) throw error;
      userIds = (data ?? []).map((p) => p.id);
    } else {
      const { data, error } = await admin
        .from("profiles")
        .select("id")
        .eq("username", username!.toLowerCase())
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) {
        return { ok: false, error: `User "${username}" not found.` };
      }
      userIds = [data[0].id];
    }

    if (userIds.length === 0) {
      return { ok: false, error: "No users to notify." };
    }

    const rows = userIds.map((user_id) => ({ user_id, title, body }));
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await admin.from("notifications").insert(rows.slice(i, i + 500));
      if (error) throw error;
    }

    await audit(auth.adminId, null, "notify", {
      audience: target,
      count: userIds.length,
      title,
    });
    revalidatePath("/admin/notifications");
    return {
      ok: true,
      message: `Sent to ${userIds.length} user${userIds.length === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    console.error("[admin] sendNotification failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
