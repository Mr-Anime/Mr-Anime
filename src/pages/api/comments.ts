import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { currentUser, json } from "../../lib/auth";

export const GET: APIRoute = async (context) => {
  const { url } = context;
  const animeId = Number(url.searchParams.get("animeId"));
  const episode = Number(url.searchParams.get("episode"));
  if (!Number.isSafeInteger(animeId) || animeId < 1 || !Number.isSafeInteger(episode) || episode < 1) {
    return json({ error: "A valid anime ID and episode are required." }, 400);
  }
  const [result, viewer] = await Promise.all([env.DB.prepare(`
    SELECT c.id, c.user_id, c.body, c.created_at, u.username, u.badge, ns.css_class, f.image_path AS frame_image
    FROM comments c JOIN users u ON u.id = c.user_id
    LEFT JOIN profiles p ON p.user_id = u.id
    LEFT JOIN name_styles ns ON ns.id = p.name_style_id
    LEFT JOIN frames f ON f.id = p.frame_id
    WHERE c.anime_id = ? AND c.episode = ? AND c.status = 'visible'
    ORDER BY c.created_at DESC LIMIT 100
  `).bind(animeId, episode).all(), currentUser(context)]);
  return json({ comments: result.results, viewer });
};

export const POST: APIRoute = async (context) => {
  const user = await currentUser(context);
  if (!user) return json({ error: "Sign in to join the discussion." }, 401);
  let input: Record<string, unknown>;
  try {
    input = await context.request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return json({ error: "A JSON object is required." }, 400);
  const animeId = Number(input.animeId);
  const episode = Number(input.episode);
  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (!Number.isSafeInteger(animeId) || animeId < 1 || !Number.isSafeInteger(episode) || episode < 1) {
    return json({ error: "A valid anime ID and episode are required." }, 400);
  }
  if (body.length < 1 || body.length > 1000) return json({ error: "Comments must be between 1 and 1000 characters." }, 400);
  const result = await env.DB.prepare(
    "INSERT INTO comments (user_id, anime_id, episode, body) VALUES (?, ?, ?, ?)",
  ).bind(user.id, animeId, episode, body).run();
  return json({ id: result.meta.last_row_id }, 201);
};

export const DELETE: APIRoute = async (context) => {
  const user = await currentUser(context);
  if (!user || (user.role !== "moderator" && user.role !== "admin")) {
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
  if (!Number.isSafeInteger(commentId) || commentId < 1) return json({ error: "A valid comment ID is required." }, 400);
  const db = env.DB;
  const existing = await db.prepare("SELECT id, user_id FROM comments WHERE id = ?").bind(commentId).first<{ id: number; user_id: number }>();
  if (!existing) return json({ error: "Comment not found." }, 404);
  await db.batch([
    db.prepare("UPDATE comments SET status = 'removed' WHERE id = ?").bind(commentId),
    db.prepare("INSERT INTO moderation_actions (actor_id, target_user_id, comment_id, action) VALUES (?, ?, ?, 'remove_comment')")
      .bind(user.id, existing.user_id, commentId),
  ]);
  return json({ ok: true });
};

export const PATCH: APIRoute = async (context) => {
  const user = await currentUser(context);
  if (!user) return json({ error: "Sign in to report a comment." }, 401);
  let input: Record<string, unknown>;
  try {
    input = await context.request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return json({ error: "A JSON object is required." }, 400);
  const commentId = Number(input.commentId);
  if (!Number.isSafeInteger(commentId) || commentId < 1) return json({ error: "A valid comment ID is required." }, 400);
  const db = env.DB;
  const comment = await db.prepare("SELECT id, user_id FROM comments WHERE id = ? AND status = 'visible'")
    .bind(commentId).first<{ id: number; user_id: number }>();
  if (!comment) return json({ error: "Comment not found." }, 404);
  if (comment.user_id === user.id) return json({ error: "You cannot report your own comment." }, 400);
  await db.batch([
    db.prepare("UPDATE comments SET status = 'flagged' WHERE id = ?").bind(commentId),
    db.prepare("INSERT INTO moderation_actions (actor_id, target_user_id, comment_id, action, reason) VALUES (?, ?, ?, 'flag_comment', 'User report')")
      .bind(user.id, comment.user_id, commentId),
  ]);
  return json({ ok: true });
};
