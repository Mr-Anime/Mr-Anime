import type { APIRoute } from "astro";
import { currentUser, json } from "../../lib/auth";

export const GET: APIRoute = async (context) => {
  const user = await currentUser(context);
  if (!user || user.role !== "admin") return json({ error: "Admin access is required." }, 403);
  const db = context.locals.runtime.env.DB;
  const [users, frames, styles] = await Promise.all([
    db.prepare("SELECT id, username, email, role, status, blocked_until, badge, created_at FROM users ORDER BY created_at DESC LIMIT 200").all(),
    db.prepare("SELECT id, name FROM frames WHERE active = 1 ORDER BY name").all(),
    db.prepare("SELECT id, name FROM name_styles WHERE active = 1 ORDER BY name").all(),
  ]);
  return json({ users: users.results, frames: frames.results, styles: styles.results });
};

export const POST: APIRoute = async (context) => {
  const actor = await currentUser(context);
  if (!actor || (actor.role !== "admin" && actor.role !== "moderator")) {
    return json({ error: "Staff access is required." }, 403);
  }
  let input: Record<string, unknown>;
  try {
    input = await context.request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return json({ error: "A JSON object is required." }, 400);
  const action = typeof input.action === "string" ? input.action : "";
  const db = context.locals.runtime.env.DB;

  if (action === "notice") {
    if (actor.role !== "admin") return json({ error: "Only admins can send notices." }, 403);
    const title = typeof input.title === "string" ? input.title.trim() : "";
    const body = typeof input.body === "string" ? input.body.trim() : "";
    if (title.length < 1 || title.length > 120 || body.length < 1 || body.length > 2000) {
      return json({ error: "Title (1–120 chars) and message (1–2000 chars) are required." }, 400);
    }
    const userId = input.userId === undefined || input.userId === "" ? null : Number(input.userId);
    if (userId !== null && (!Number.isSafeInteger(userId) || userId < 1)) return json({ error: "Invalid recipient user ID." }, 400);
    if (userId !== null && !(await db.prepare("SELECT id FROM users WHERE id = ?").bind(userId).first())) {
      return json({ error: "Recipient user not found." }, 404);
    }
    await db.prepare("INSERT INTO notifications (user_id, title, body, kind, created_by) VALUES (?, ?, ?, 'notice', ?)")
      .bind(userId, title, body, actor.id).run();
    return json({ ok: true }, 201);
  }

  if (action === "role") {
    if (actor.role !== "admin") return json({ error: "Only admins can change roles." }, 403);
    const userId = Number(input.userId);
    const role = input.role;
    if (!Number.isSafeInteger(userId) || userId < 1 || !["user", "moderator", "admin"].includes(String(role))) {
      return json({ error: "A valid user ID and role are required." }, 400);
    }
    if (userId === actor.id) return json({ error: "You cannot change your own role." }, 400);
    const updated = await db.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, userId).run();
    if (updated.meta.changes === 0) return json({ error: "User not found." }, 404);
    await db.prepare("INSERT INTO moderation_actions (actor_id, target_user_id, action) VALUES (?, ?, 'change_role')")
      .bind(actor.id, userId).run();
    return json({ ok: true });
  }

  if (action === "grant-frame") {
    if (actor.role !== "admin") return json({ error: "Only admins can grant items." }, 403);
    const userId = Number(input.userId);
    const frameId = Number(input.frameId);
    if (!Number.isSafeInteger(userId) || userId < 1 || !Number.isSafeInteger(frameId) || frameId < 1) {
      return json({ error: "A valid user ID and frame ID are required." }, 400);
    }
    const [target, frame] = await Promise.all([
      db.prepare("SELECT id FROM users WHERE id = ?").bind(userId).first(),
      db.prepare("SELECT id FROM frames WHERE id = ? AND active = 1").bind(frameId).first(),
    ]);
    if (!target) return json({ error: "User not found." }, 404);
    if (!frame) return json({ error: "Frame not found." }, 404);
    const granted = await db.prepare(`
      INSERT OR IGNORE INTO user_inventory (user_id, item_type, item_id, granted_by)
      SELECT ?, 'frame', id, ? FROM frames WHERE id = ? AND active = 1
    `).bind(userId, actor.id, frameId).run();
    if (granted.meta.changes > 0) {
      await db.prepare("INSERT INTO notifications (user_id, title, body, kind, created_by) VALUES (?, 'Gift unlocked', 'A profile frame was added to your collection.', 'reward', ?)")
        .bind(userId, actor.id).run();
    }
    return json({ ok: true });
  }

  if (action === "badge") {
    if (actor.role !== "admin") return json({ error: "Only admins can grant badges." }, 403);
    const userId = Number(input.userId);
    const badge = typeof input.badge === "string" ? input.badge.trim() : "";
    if (!Number.isSafeInteger(userId) || userId < 1 || badge.length < 1 || badge.length > 32) {
      return json({ error: "A valid user ID and badge name (1–32 characters) are required." }, 400);
    }
    const updated = await db.prepare("UPDATE users SET badge = ? WHERE id = ?").bind(badge, userId).run();
    if (updated.meta.changes === 0) return json({ error: "User not found." }, 404);
    await db.prepare("INSERT INTO notifications (user_id, title, body, kind, created_by) VALUES (?, 'Badge received', ?, 'reward', ?)")
      .bind(userId, `You received the ${badge} badge.`, actor.id).run();
    return json({ ok: true });
  }

  if (action === "block" || action === "ban" || action === "unblock") {
    const userId = Number(input.userId);
    if (!Number.isSafeInteger(userId) || userId < 1) return json({ error: "A valid user ID is required." }, 400);
    if (userId === actor.id) return json({ error: "You cannot restrict your own account." }, 400);
    const target = await db.prepare("SELECT id, role FROM users WHERE id = ?").bind(userId).first<{ id: number; role: string }>();
    if (!target) return json({ error: "User not found." }, 404);
    if (target.role === "admin" && actor.role !== "admin") return json({ error: "Moderators cannot restrict an admin." }, 403);
    if (action === "unblock") {
      await db.prepare("UPDATE users SET status = 'active', blocked_until = NULL WHERE id = ?").bind(userId).run();
    } else if (action === "ban") {
      await db.prepare("UPDATE users SET status = 'banned', blocked_until = NULL WHERE id = ?").bind(userId).run();
    } else {
      const minutes = Number(input.minutes);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080) {
        return json({ error: "Temporary blocks must be between 1 minute and 7 days." }, 400);
      }
      const until = new Date(Date.now() + minutes * 60_000).toISOString();
      await db.prepare("UPDATE users SET status = 'blocked', blocked_until = ? WHERE id = ?").bind(until, userId).run();
    }
    await db.prepare("INSERT INTO moderation_actions (actor_id, target_user_id, action, reason) VALUES (?, ?, ?, ?)")
      .bind(actor.id, userId, action, typeof input.reason === "string" ? input.reason.slice(0, 500) : null).run();
    return json({ ok: true });
  }

  return json({ error: "Unknown admin action." }, 400);
};
