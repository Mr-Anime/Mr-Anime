import type { APIRoute } from "astro";
import { currentUser, json } from "../../lib/auth";

export const GET: APIRoute = async (context) => {
  const user = await currentUser(context);
  if (!user) return json({ error: "Sign in to view notifications." }, 401);
  const result = await context.locals.runtime.env.DB.prepare(`
    SELECT n.id, n.title, n.body, n.kind, n.created_at
    FROM notifications n
    LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.user_id = ?
    WHERE (n.user_id IS NULL OR n.user_id = ?) AND r.notification_id IS NULL
    ORDER BY n.created_at DESC LIMIT 50
  `).bind(user.id, user.id).all();
  return json({ notifications: result.results });
};

export const POST: APIRoute = async (context) => {
  const user = await currentUser(context);
  if (!user) return json({ error: "Sign in to update notifications." }, 401);
  let input: Record<string, unknown>;
  try {
    input = await context.request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return json({ error: "A JSON object is required." }, 400);
  const id = Number(input.id);
  if (!Number.isSafeInteger(id) || id < 1) return json({ error: "A valid notification ID is required." }, 400);
  await context.locals.runtime.env.DB.prepare(`
    INSERT OR IGNORE INTO notification_reads (notification_id, user_id)
    SELECT id, ? FROM notifications WHERE id = ? AND (user_id IS NULL OR user_id = ?)
  `).bind(user.id, id, user.id).run();
  return json({ ok: true });
};
