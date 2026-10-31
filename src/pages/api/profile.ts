import type { APIRoute } from "astro";
import { currentUser, json } from "../../lib/auth";

export const GET: APIRoute = async (context) => {
  const user = await currentUser(context);
  if (!user) return json({ error: "Sign in to view your profile." }, 401);
  const db = context.locals.runtime.env.DB;
  await db.prepare("INSERT OR IGNORE INTO profiles (user_id) VALUES (?)").bind(user.id).run();
  const [profile, frames, styles] = await Promise.all([
    db.prepare(`
      SELECT p.frame_id, p.name_style_id, f.name AS frame_name, f.image_path, ns.name AS style_name, ns.css_class
      FROM profiles p
      LEFT JOIN frames f ON f.id = p.frame_id
      LEFT JOIN name_styles ns ON ns.id = p.name_style_id
      WHERE p.user_id = ?
    `).bind(user.id).first(),
    db.prepare(`
      SELECT f.id, f.name, f.image_path FROM user_inventory i
      JOIN frames f ON i.item_type = 'frame' AND i.item_id = f.id
      WHERE i.user_id = ? AND f.active = 1 ORDER BY f.name
    `).bind(user.id).all(),
    db.prepare(`
      SELECT ns.id, ns.name, ns.css_class FROM user_inventory i
      JOIN name_styles ns ON i.item_type = 'name_style' AND i.item_id = ns.id
      WHERE i.user_id = ? AND ns.active = 1 ORDER BY ns.name
    `).bind(user.id).all(),
  ]);
  return json({ user, profile, frames: frames.results, styles: styles.results });
};

export const PATCH: APIRoute = async (context) => {
  const user = await currentUser(context);
  if (!user) return json({ error: "Sign in to update your profile." }, 401);
  let input: Record<string, unknown>;
  try {
    input = await context.request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return json({ error: "A JSON object is required." }, 400);
  const frameId = input.frameId === null ? null : Number(input.frameId);
  const styleId = input.styleId === null ? null : Number(input.styleId);
  if ((frameId !== null && (!Number.isSafeInteger(frameId) || frameId < 1)) ||
      (styleId !== null && (!Number.isSafeInteger(styleId) || styleId < 1))) {
    return json({ error: "Invalid profile item selection." }, 400);
  }
  const db = context.locals.runtime.env.DB;
  if (frameId !== null) {
    const owned = await db.prepare(`
      SELECT 1 FROM user_inventory i JOIN frames f ON f.id = i.item_id
      WHERE i.user_id = ? AND i.item_type = 'frame' AND i.item_id = ? AND f.active = 1
    `)
      .bind(user.id, frameId).first();
    if (!owned) return json({ error: "You don't own that frame." }, 403);
  }
  if (styleId !== null) {
    const owned = await db.prepare(`
      SELECT 1 FROM user_inventory i JOIN name_styles ns ON ns.id = i.item_id
      WHERE i.user_id = ? AND i.item_type = 'name_style' AND i.item_id = ? AND ns.active = 1
    `)
      .bind(user.id, styleId).first();
    if (!owned) return json({ error: "You don't own that name style." }, 403);
  }
  await db.prepare("INSERT OR IGNORE INTO profiles (user_id) VALUES (?)").bind(user.id).run();
  await db.prepare("UPDATE profiles SET frame_id = ?, name_style_id = ? WHERE user_id = ?")
    .bind(frameId, styleId, user.id).run();
  return json({ ok: true });
};
