import type { APIRoute } from "astro";
import { getDb } from "../../lib/db";
import { oauthClients, oauthConsents, oauthAuthCodes } from "../../lib/schema";
import { eq, and } from "drizzle-orm";
import { sha256Hex, randomBytesHex } from "../../lib/crypto";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = (locals as any).user;
    if (!user) return new Response("Unauthorized", { status: 401 });
    const env = (locals as any).runtime?.env;
    const db = getDb(env);
    const form = await request.formData();
    const action = String(form.get("action") || "");
    const client_id = String(form.get("client_id") || "");
    const redirect_uri = String(form.get("redirect_uri") || "");
    const scope = String(form.get("scope") || "profile");
    const state = String(form.get("state") || "");
    const code_challenge = String(form.get("code_challenge") || "");
    const code_challenge_method = String(form.get("code_challenge_method") || "");
    const client = await db.select().from(oauthClients).where(eq(oauthClients.clientId, client_id)).get();
    if (!client || client.isActive !== 1) return new Response("Invalid client", { status: 400 });
    let redirectUris: string[] = [];
    try { redirectUris = JSON.parse(client.redirectUris || "[]"); } catch {}
    if (!redirectUris.includes(redirect_uri)) return new Response("Invalid redirect_uri", { status: 400 });
    if (action === "deny") {
      const r = new URL(redirect_uri);
      r.searchParams.set("error", "access_denied");
      r.searchParams.set("state", state);
      return Response.redirect(r.toString(), 302);
    }
    const scopes = scope.split(" ").filter(Boolean);
    const now = Math.floor(Date.now()/1000);
    await db.insert(oauthConsents).values({ userId: user.id, clientId: client.clientId, scopes: JSON.stringify(scopes), grantedAt: now }).onConflictDoUpdate({ target: [oauthConsents.userId, oauthConsents.clientId], set: { scopes: JSON.stringify(scopes), grantedAt: now } });
    const code = randomBytesHex(32);
    const codeHash = await sha256Hex(code);
    await db.insert(oauthAuthCodes).values({ codeHash, clientId: client.clientId, userId: user.id, redirectUri: redirect_uri, scopes: JSON.stringify(scopes), codeChallenge: code_challenge, codeChallengeMethod: code_challenge_method || "S256", expiresAt: now + 600, usedAt: null });
    const r = new URL(redirect_uri);
    r.searchParams.set("code", code);
    r.searchParams.set("state", state);
    return Response.redirect(r.toString(), 302);
  } catch (e:any) {
    return new Response(e.message, { status: 500 });
  }
};

export const config = { runtime: "edge" };