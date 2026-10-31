import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { hashPassword, issueSession, json } from "../../../lib/auth";

export const POST: APIRoute = async (context) => {
  const { request } = context;
  let input: Record<string, unknown>;
  try {
    input = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return json({ error: "A JSON object is required." }, 400);

  const username = typeof input.username === "string" ? input.username.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!/^[\p{L}\p{N}_-]{3,24}$/u.test(username)) {
    return json({ error: "Username must be 3–24 letters, numbers, underscores, or hyphens." }, 400);
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }
  if (password.length < 8 || new TextEncoder().encode(password).length > 128) {
    return json({ error: "Password must be at least 8 characters and no more than 128 bytes." }, 400);
  }

  const passwordHash = await hashPassword(password);
  const result = await env.DB.prepare(
    "INSERT OR IGNORE INTO users (username, email, password_hash) VALUES (?, ?, ?)",
  ).bind(username, email, passwordHash).run();

  if (result.meta.changes === 0) return json({ error: "That email or username is already in use." }, 409);
  const userId = Number(result.meta.last_row_id);
  await env.DB.prepare("INSERT INTO profiles (user_id) VALUES (?)").bind(userId).run();
  await issueSession(context, userId);
  return json({ user: { username } }, 201);
};
