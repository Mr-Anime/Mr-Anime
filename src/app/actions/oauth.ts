"use server";

import { redirect } from "next/navigation";
import { CODE_TTL_MS, generateAuthCode, parseScopes } from "@/lib/oauth2";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isAllowedRedirectUri } from "@/lib/redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function authorizePath(params: {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
}): string {
  const sp = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: "code",
    scope: params.scope,
  });
  if (params.state) sp.set("state", params.state);
  return `/oauth/authorize?${sp.toString()}`;
}

function withParams(
  redirectUri: string,
  extra: Record<string, string>,
): string {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(extra)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

/**
 * Consent form handler for GET /oauth/authorize: approve issues a
 * single-use code and redirects back to the app; deny redirects with
 * error=access_denied. Every failure bounces back to the consent page
 * with ?error=… (fields are re-validated against the database).
 */
export async function handleOAuthConsent(formData: FormData): Promise<void> {
  const str = (key: string) => String(formData.get(key) ?? "").slice(0, 2000);
  const clientId = str("client_id").trim();
  const redirectUri = str("redirect_uri").trim();
  const scope = str("scope").trim();
  const state = str("state");
  const decision = str("decision");
  const back = () =>
    authorizePath({ clientId, redirectUri, scope, state });
  const fail: (message: string) => never = (message) =>
    redirect(`${back()}&error=${encodeURIComponent(message)}`);

  if (!clientId || !redirectUri || !scope) {
    redirect("/oauth/authorize?error=Missing%20authorization%20parameters.");
  }

  const ip = await clientIp();
  const limit = rateLimit(`oauth-consent:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!limit.ok) {
    fail("Too many attempts — wait a minute and try again.");
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) {
    redirect(`/login?next=${encodeURIComponent(back())}`);
  }

  const scopes = parseScopes(scope);
  if (!scopes || scopes.length === 0) {
    fail("Invalid scope.");
  }

  let client: {
    id: string;
    redirect_uris: string[];
  } | null = null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("oauth_clients")
      .select("id, redirect_uris")
      .eq("client_id", clientId)
      .is("revoked_at", null)
      .maybeSingle();
    if (error) throw error;
    client = data;
  } catch (error) {
    console.error("oauth consent: client lookup failed", error);
    fail("Authorization is temporarily unavailable.");
  }

  if (!client) fail("Unknown application.");
  if (!client.redirect_uris.includes(redirectUri) || !isAllowedRedirectUri(redirectUri)) {
    fail("redirect_uri does not match the URI registered by this application.");
  }

  if (decision !== "approve") {
    redirect(withParams(redirectUri, { error: "access_denied", state }));
  }

  const { value: code, hash } = generateAuthCode();
  const normalizedScope = scopes.join(" ");
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("oauth_codes").insert({
      code_hash: hash,
      client_id: client.id,
      user_id: userId,
      redirect_uri: redirectUri,
      scope: normalizedScope,
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    });
    if (error) throw error;
  } catch (error) {
    console.error("oauth consent: code insert failed", error);
    fail("Could not issue an authorization code. Try again.");
  }

  redirect(withParams(redirectUri, { code, state }));
}
