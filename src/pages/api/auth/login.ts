import type { APIRoute } from "astro";
import { issueSession, json, verifyPassword } from "../../../lib/auth";

export const POST: APIRoute = async (context) => {
  let input: Record<string, unknown>;
  try {
    input = await context.request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return json({ error: "A JSON object is required." }, 400);
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !password) return json({ error: "Email and password are required." }, 400);

  const user = await context.locals.runtime.env.DB.prepare(
    "SELECT id, username, password_hash, status, blocked_until FROM users WHERE email = ?",
  ).bind(email).first<{ id: number; username: string; password_hash: string; status: string; blocked_until: string | null }>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return json({ error: "Email or password is incorrect." }, 401);
  }
  if (user.status === "banned" || (user.status === "blocked" && (!user.blocked_until || user.blocked_until > new Date().toISOString()))) {
    return json({ error: "This account is currently restricted." }, 403);
  }
  if (user.status === "blocked") {
    await context.locals.runtime.env.DB.prepare(
      "UPDATE users SET status = 'active', blocked_until = NULL WHERE id = ?",
    ).bind(user.id).run();
  }
  await issueSession(context, user.id);
  return json({ user: { username: user.username } });
};
