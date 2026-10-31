import type { APIRoute } from "astro";
import { getDb } from "../../lib/db";
import { oauthTokens } from "../../lib/schema";
import { eq } from "drizzle-orm";
import { sha256Hex } from "../../lib/crypto";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = getDb(env);
    const ct = request.headers.get("content-type") || "";
    let body: any = {};
    if (ct.includes("application/json")) body = await request.json();
    else {
      const form = await request.formData();
      for (const [k,v] of form.entries()) body[k]=String(v);
    }
    const token = body.token;
    if (!token) return new Response("", { status: 200 });
    const hash = await sha256Hex(token);
    const t = await db.select().from(oauthTokens).where(eq(oauthTokens.accessTokenHash, hash)).get() || await db.select().from(oauthTokens).where(eq(oauthTokens.refreshTokenHash, hash)).get();
    if (t && !t.revokedAt) {
      await db.update(oauthTokens).set({ revokedAt: Math.floor(Date.now()/1000) }).where(eq(oauthTokens.id, t.id));
    }
    return new Response("", { status: 200, headers: {"Cache-Control":"no-store"} });
  } catch (e:any) {
    return new Response("", { status: 200 });
  }
};

export const config = { runtime: "edge" };