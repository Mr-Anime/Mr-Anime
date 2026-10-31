import type { APIRoute } from "astro";
import { getDb } from "../../lib/db";
import { oauthTokens, users } from "../../lib/schema";
import { eq } from "drizzle-orm";
import { sha256Hex } from "../../lib/crypto";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = getDb(env);
    const auth = request.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({error:"invalid_token"}), { status: 401, headers: {"Content-Type":"application/json"} });
    const tHash = await sha256Hex(token);
    const t = await db.select().from(oauthTokens).where(eq(oauthTokens.accessTokenHash, tHash)).get();
    if (!t || t.revokedAt || t.accessExpiresAt < Math.floor(Date.now()/1000)) return new Response(JSON.stringify({error:"invalid_token"}), { status: 401, headers: {"Content-Type":"application/json"} });
    const user = await db.select().from(users).where(eq(users.id, t.userId)).get();
    if (!user || user.isBanned) return new Response(JSON.stringify({error:"invalid_token"}), { status: 401, headers: {"Content-Type":"application/json"} });
    const scopes = JSON.parse(t.scopes || '["profile"]');
    const out: any = { sub: user.id };
    if (scopes.includes("profile")) { out.username = user.username; out.avatar_url = user.avatarUrl; out.role = user.role; out.is_verified = user.isVerified; out.badges = JSON.parse(user.badges || "[]"); }
    if (scopes.includes("email")) { out.email = user.email; out.email_verified = user.emailVerified; }
    return new Response(JSON.stringify(out), { headers: {"Content-Type":"application/json","Cache-Control":"no-store"} });
  } catch (e:any) {
    return new Response(JSON.stringify({error:"server_error"}), { status: 500, headers: {"Content-Type":"application/json"} });
  }
};

export const config = { runtime: "edge" };