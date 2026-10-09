import {
  ACCESS_TOKEN_TTL_SECONDS,
  generateAccessToken,
  parseScopes,
  sha256,
  verifyClientSecret,
} from "@/lib/oauth2";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function oauthError(
  status: number,
  error: string,
  description: string,
  extraHeaders?: Record<string, string>,
): Response {
  return Response.json(
    { error, error_description: description },
    { status, headers: { "Cache-Control": "no-store", ...extraHeaders } },
  );
}

async function readParams(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    const out: Record<string, string> = {};
    for (const [key, value] of form) {
      if (typeof value === "string") out[key] = value;
    }
    return out;
  }
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object") {
      const out: Record<string, string> = {};
      for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
        if (typeof value === "string") out[key] = value;
      }
      return out;
    }
  } catch {
    // fall through — missing params are reported as invalid_request
  }
  return {};
}

/**
 * OAuth 2.0 token endpoint (RFC 6749). Supports:
 *  - authorization_code: single-use 5-minute code from /oauth/authorize
 *  - client_credentials: server-to-server API access (read scope only)
 * Both require client_id + client_secret (body params).
 */
export async function POST(request: Request): Promise<Response> {
  const ip = await clientIp();
  const ipLimit = rateLimit(`oauth-token:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!ipLimit.ok) {
    return oauthError(429, "slow_down", "Too many token requests.", {
      "Retry-After": "60",
    });
  }

  const params = await readParams(request);
  const clientId = params.client_id?.trim();
  const clientSecret = params.client_secret?.trim();
  if (!clientId || !clientSecret) {
    return oauthError(401, "invalid_client", "client_id and client_secret are required.");
  }

  let client: {
    id: string;
    client_secret_hash: string;
    revoked_at: string | null;
    redirect_uris: string[];
  } | null = null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("oauth_clients")
      .select("id, client_secret_hash, revoked_at, redirect_uris")
      .eq("client_id", clientId)
      .maybeSingle();
    if (error) throw error;
    client = data;
  } catch (error) {
    console.error("oauth token: client lookup failed", error);
    return oauthError(503, "server_error", "Token service is temporarily unavailable.");
  }

  if (
    !client ||
    client.revoked_at ||
    !verifyClientSecret(clientSecret, client.client_secret_hash)
  ) {
    return oauthError(401, "invalid_client", "Client authentication failed.");
  }

  const clientLimit = rateLimit(`oauth-token-client:${client.id}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!clientLimit.ok) {
    return oauthError(429, "slow_down", "Too many token requests for this client.", {
      "Retry-After": "60",
    });
  }

  const grantType = params.grant_type?.trim();

  if (grantType === "client_credentials") {
    const scopes = parseScopes(params.scope?.trim() || "read");
    if (scopes === null || scopes.includes("profile") || scopes.length === 0) {
      return oauthError(
        400,
        "invalid_scope",
        "client_credentials tokens may only request the read scope.",
      );
    }

    const { value: token, hash } = generateAccessToken();
    try {
      const admin = createAdminClient();
      const { error } = await admin.from("oauth_tokens").insert({
        token_hash: hash,
        client_id: client.id,
        user_id: null,
        scope: "read",
        expires_at: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
      });
      if (error) throw error;
    } catch (error) {
      console.error("oauth token: insert failed", error);
      return oauthError(503, "server_error", "Could not issue a token. Try again.");
    }

    return Response.json(
      {
        access_token: token,
        token_type: "Bearer",
        expires_in: ACCESS_TOKEN_TTL_SECONDS,
        scope: "read",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (grantType === "authorization_code") {
    const code = params.code?.trim();
    const redirectUri = params.redirect_uri?.trim();
    if (!code || !redirectUri) {
      return oauthError(400, "invalid_grant", "code and redirect_uri are required.");
    }

    // Atomically claim the code: it is single-use even under concurrency.
    let row: {
      client_id: string;
      user_id: string;
      redirect_uri: string;
      scope: string;
      expires_at: string;
    } | null = null;
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("oauth_codes")
        .delete()
        .eq("code_hash", sha256(code))
        .select("client_id, user_id, redirect_uri, scope, expires_at")
        .maybeSingle();
      if (error) throw error;
      row = data;
    } catch (error) {
      console.error("oauth token: code claim failed", error);
      return oauthError(503, "server_error", "Could not validate the code. Try again.");
    }

    if (!row) {
      return oauthError(400, "invalid_grant", "The authorization code is invalid or expired.");
    }
    if (row.client_id !== client.id) {
      return oauthError(400, "invalid_grant", "The code was not issued to this client.");
    }
    if (Date.parse(row.expires_at) <= Date.now()) {
      return oauthError(400, "invalid_grant", "The authorization code has expired.");
    }
    if (row.redirect_uri !== redirectUri) {
      return oauthError(
        400,
        "invalid_grant",
        "redirect_uri does not match the authorization request.",
      );
    }

    const { value: token, hash } = generateAccessToken();
    try {
      const admin = createAdminClient();
      const { error } = await admin.from("oauth_tokens").insert({
        token_hash: hash,
        client_id: client.id,
        user_id: row.user_id,
        scope: row.scope,
        expires_at: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
      });
      if (error) throw error;
    } catch (error) {
      console.error("oauth token: insert failed", error);
      return oauthError(503, "server_error", "Could not issue a token. Try again.");
    }

    return Response.json(
      {
        access_token: token,
        token_type: "Bearer",
        expires_in: ACCESS_TOKEN_TTL_SECONDS,
        scope: row.scope,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return oauthError(
    400,
    "unsupported_grant_type",
    "Supported grant types: authorization_code, client_credentials.",
  );
}
