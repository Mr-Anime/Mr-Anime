import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db";
import { users } from "../../../lib/schema";
import { eq } from "drizzle-orm";
import { createSession, SESSION_COOKIE } from "../../../lib/session";

async function hashPassword(pw: string) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = getDb(env);
    const form = await request.formData();
    const email = String(form.get("email") || "").toLowerCase().trim();
    const password = String(form.get("password") || "");
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user || !user.passwordHash) return new Response("Invalid credentials", { status: 400 });
    const hp = await hashPassword(password);
    if (hp !== user.passwordHash) return new Response("Invalid credentials", { status: 400 });
    if (user.isBanned) return Response.redirect(new URL("/suspended", request.url), 302);
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || undefined;
    const ua = request.headers.get("user-agent") || undefined;
    const { token, expiresAt } = await createSession(env, user.id, ip, ua);
    cookies.set(SESSION_COOKIE, token, { path: "/", httpOnly: true, secure: true, sameSite: "lax", expires: new Date(expiresAt * 1000) });
    return Response.redirect(new URL("/", request.url), 302);
  } catch (e:any) {
    return new Response(e.message, { status: 500 });
  }
};

export const config = { runtime: "edge" };