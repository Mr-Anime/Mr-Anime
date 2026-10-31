import type { APIRoute } from "astro";
import { currentUser, json } from "../../lib/auth";

export const GET: APIRoute = async (context) => {
  const user = await currentUser(context);
  if (!user || (user.role !== "moderator" && user.role !== "admin")) {
    return json({ error: "Moderator access is required." }, 403);
  }
  const result = await context.locals.runtime.env.DB.prepare(`
    SELECT c.id, c.user_id, c.anime_id, c.episode, c.body, c.created_at, u.username
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.status = 'flagged'
    ORDER BY c.created_at ASC LIMIT 100
  `).all();
  return json({ comments: result.results });
};

export const POST: APIRoute = async (context) => {
  const actor = await currentUser(context);
  if (!actor || (actor.role !== "moderator" && actor.role !== "admin")) {
    return json({ error: "Moderator access is required." }, 403);
  }
  let input: Record<string, unknown>;
  try {
    input = await context.request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return json({ error: "A JSON object is required." }, 400);
  const commentId = Number(input.commentId);
  const action = input.action;
  if (!Number.isSafeInteger(commentId) || commentId < 1 || (action !== "remove" && action !== "dismiss")) {
    return json({ error: "A valid comment ID and moderation action are required." }, 400);
  }
  const db = context.locals.runtime.env.DB;
  const comment = await db.prepare("SELECT id, user_id FROM comments WHERE id = ? AND status = 'flagged'")
    .bind(commentId).first<{ id: number; user_id: number }>();
  if (!comment) return json({ error: "Flagged comment not found." }, 404);
  const status = action === "remove" ? "removed" : "visible";
  await db.batch([
    db.prepare("UPDATE comments SET status = ? WHERE id = ?").bind(status, commentId),
    db.prepare("INSERT INTO moderation_actions (actor_id, target_user_id, comment_id, action) VALUES (?, ?, ?, ?)")
      .bind(actor.id, comment.user_id, commentId, action === "remove" ? "remove_flagged_comment" : "dismiss_comment_flag"),
  ]);
  return json({ ok: true });
};
