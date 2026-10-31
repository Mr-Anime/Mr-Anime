import type { APIRoute } from "astro";
import { getDb } from "../../lib/db";
import { oauthClients, oauthAuthCodes, oauthTokens } from "../../lib/schema";
import { eq } from "drizzle-orm";
import { sha256Hex, randomBytesHex, base64url } from "../../lib/crypto";
import { nanoid } from "nanoid";

function b64urlToBuf(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
  return arr;
}

async function verifyPkce(verifier: string, challenge: string) {
  const enc = new TextEncoder().encode(verifier);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const calc = base64url(buf);
  return calc === challenge;
}

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
    const grant_type = body.grant_type;
    if (grant_type === "authorization_code") {
      const code = body.code;
      const client_id = body.client_id;
      const redirect_uri = body.redirect_uri;
      const code_verifier = body.code_verifier;
      const codeHash = await sha256Hex(code);
      const authCode = await db.select().from(oauthAuthCodes).where(eq(oauthAuthCodes.codeHash, codeHash)).get();
      if (!authCode || authCode.usedAt || authCode.expiresAt < Math.floor(Date.now()/1000)) return new Response(JSON.stringify({error:"invalid_grant"}), { status: 400, headers: {"Content-Type":"application/json","Cache-Control":"no-store"} });
      if (authCode.redirectUri !== redirect_uri) return new Response(JSON.stringify({error:"invalid_grant"}), { status: 400, headers: {"Content-Type":"application/json","Cache-Control":"no-store"} });
      if (!await verifyPkce(code_verifier, authCode.codeChallenge)) return new Response(JSON.stringify({error:"invalid_grant"}), { status: 400, headers: {"Content-Type":"application/json","Cache-Control":"no-store"} });
      await db.update(oauthAuthCodes).set({ usedAt: Math.floor(Date.now()/1000) }).where(eq(oauthAuthCodes.codeHash, codeHash));
      const client = await db.select().from(oauthClients).where(eq(oauthClients.clientId, client_id)).get();
      if (!client) return new Response(JSON.stringify({error:"invalid_client"}), { status: 400, headers: {"Content-Type":"application/json","Cache-Control":"no-store"} });
      const accessToken = randomBytesHex(32);
      const refreshToken = randomBytesHex(32);
      const now = Math.floor(Date.now()/1000);
      await db.insert(oauthTokens).values({ id: nanoid(), accessTokenHash: await sha256Hex(accessToken), refreshTokenHash: await sha256Hex(refreshToken), clientId: client.clientId, userId: authCode.userId, scopes: authCode.scopes, accessExpiresAt: now + 3600, refreshExpiresAt: now + 60*60*24*30, revokedAt: null, rotatedFrom: null });
      return new Response(JSON.stringify({ access_token: accessToken, token_type: "Bearer", expires_in: 3600, refresh_token: refreshToken, scope: JSON.parse(authCode.scopes).join(" ") }), { headers: {"Content-Type":"application/json","Cache-Control":"no-store"} });
    } else if (grant_type === "refresh_token") {
      const refresh_token = body.refresh_token;
      const rHash = await sha256Hex(refresh_token);
      const token = await db.select().from(oauthTokens).where(eq(oauthTokens.refreshTokenHash, rHash)).get();
      if (!token || token.revokedAt || (token.refreshExpiresAt && token.refreshExpiresAt < Math.floor(Date.now()/1000))) return new Response(JSON.stringify({error:"invalid_grant"}), { status: 400, headers: {"Content-Type":"application/json","Cache-Control":"no-store"} });
      if (token.rotatedFrom) { await db.update(oauthTokens).set({ revokedAt: Math.floor(Date.now()/1000) }).where(eq(oauthTokens.id, token.id)); return new Response(JSON.stringify({error:"invalid_grant"}), { status: 400, headers: {"Content-Type":"application/json","Cache-Control":"no-store"} }); }
      const accessToken = randomBytesHex(32);
      const refreshToken = randomBytesHex(32);
      const now = Math.floor(Date.now()/1000);
      await db.update(oauthTokens).set({ revokedAt: now, rotatedFrom: token.id }).where(eq(oauthTokens.id, token.id));
      await db.insert(oauthTokens).values({ id: nanoid(), accessTokenHash: await sha256Hex(accessToken), refreshTokenHash: await sha256Hex(refreshToken), clientId: token.clientId, userId: token.userId, scopes: token.scopes, accessExpiresAt: now + 3600, refreshExpiresAt: now + 60*60*24*30, revokedAt: null, rotatedFrom: null });
      return new Response(JSON.stringify({ access_token: accessToken, token_type: "Bearer", expires_in: 3600, refresh_token: refreshToken, scope: JSON.parse(token.scopes).join(" ") }), { headers: {"Content-Type":"application/json","Cache-Control":"no-store"} });
    }
    return new Response(JSON.stringify({error:"unsupported_grant_type"}), { status: 400, headers: {"Content-Type":"application/json","Cache-Control":"no-store"} });
  } catch (e:any) {
    return new Response(JSON.stringify({error:"server_error"}), { status: 500, headers: {"Content-Type":"application/json","Cache-Control":"no-store"} });
  }
};

export const config = { runtime: "edge" };