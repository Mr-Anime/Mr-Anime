import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { clearSession, json } from "../../../lib/auth";

export const POST: APIRoute = async (context) => {
  const token = context.cookies.get("mr_anime_session")?.value;
  if (token) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const tokenHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  clearSession(context);
  return json({ ok: true });
};
