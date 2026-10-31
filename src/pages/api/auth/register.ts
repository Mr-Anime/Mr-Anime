import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db";
import { users } from "../../../lib/schema";
import { nanoid } from "nanoid";

async function hashPassword(pw: string) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = getDb(env);
    const form = await request.formData();
    const email = String(form.get("email") || "").toLowerCase().trim();
    const username = String(form.get("username") || "").toLowerCase().trim();
    const password = String(form.get("password") || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response("Invalid email", { status: 400 });
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return new Response("Invalid username", { status: 400 });
    if (password.length < 8) return new Response("Password too short", { status: 400 });
    const exists = await db.select().from(users).all();
    const taken = exists.find((u:any)=>u.email===email || u.username===username);
    if (taken) return new Response("Email or username taken", { status: 400 });
    const id = nanoid();
    const now = Math.floor(Date.now()/1000);
    const passwordHash = await hashPassword(password);
    await db.insert(users).values({ id, email, emailVerified: 0, passwordHash, username, avatarUrl: null, role: "user", isVerified: 0, badges: "[]", isBanned: 0, banReason: null, createdAt: now });
    return Response.redirect(new URL("/login", request.url), 302);
  } catch (e:any) {
    return new Response(e.message, { status: 500 });
  }
};

export const config = { runtime: "edge" };