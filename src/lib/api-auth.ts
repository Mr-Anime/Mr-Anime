import "server-only";
import { randomBytes } from "node:crypto";
import { ACCESS_TOKEN_PREFIX, sha256 } from "@/lib/oauth2";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/** Token issuance + verification for the public REST API (/api/v1).
 *  Accepts personal tokens (ma_live_…) and OAuth 2.0 access tokens
 *  (ma_at_…), enforcing the requested scope for the latter. */

export const TOKEN_PREFIX = "ma_live_";
const RATE_LIMIT = { limit: 60, windowMs: 60_000 };

export function hashToken(token: string): string {
  return sha256(token);
}

export function generateToken(): { token: string; hash: string; prefix: string } {
  const token = TOKEN_PREFIX + randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token), prefix: token.slice(0, 15) };
}

export type ApiAuthSuccess = {
  ok: true;
  remaining: number;
  tokenId: string;
  /** null for client_credentials tokens (no user behind them). */
  userId: string | null;
  name: string;
  /** ["*"] = personal token; otherwise OAuth scopes like "read profile". */
  scopes: string[];
};

export type ApiAuthFailure = {
  ok: false;
  status: number;
  code: string;
  message: string;
  retryAfterSeconds?: number;
};

export type ApiAuthResult = ApiAuthSuccess | ApiAuthFailure;

function bearerFrom(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return request.headers.get("x-api-key")?.trim() ?? null;
}

function throttledTouch(table: "api_tokens" | "oauth_tokens", id: string, lastUsed: string | null) {
  const previous = lastUsed ? Date.parse(lastUsed) : 0;
  if (Date.now() - previous <= 60_000) return;
  void createAdminClient()
    .from(table)
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.error(`${table} last_used update failed`, error);
    });
}

/**
 * Validates the request's bearer token: format, rate limit, DB lookup
 * (service role bypasses RLS; only SHA-256 hashes are stored), then the
 * scope required by the endpoint (default "read"). Personal tokens always
 * pass the scope check.
 */
export async function authenticateApiRequest(
  request: Request,
  { scope: requiredScope = "read" }: { scope?: "read" | "profile" } = {},
): Promise<ApiAuthResult> {
  const token = bearerFrom(request);
  if (
    !token ||
    (!token.startsWith(TOKEN_PREFIX) && !token.startsWith(ACCESS_TOKEN_PREFIX)) ||
    token.length > 200
  ) {
    return {
      ok: false,
      status: 401,
      code: "missing_token",
      message: "Provide your API token via `Authorization: Bearer <token>`.",
    };
  }

  const hash = hashToken(token);
  const limit = rateLimit(`api-token:${hash}`, RATE_LIMIT);
  if (!limit.ok) {
    return {
      ok: false,
      status: 429,
      code: "rate_limited",
      message: `Rate limit exceeded (${RATE_LIMIT.limit} requests per minute).`,
      retryAfterSeconds: Math.max(1, Math.ceil(limit.retryAfterMs / 1000)),
    };
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error("api auth: admin client unavailable", error);
    return {
      ok: false,
      status: 503,
      code: "auth_unavailable",
      message: "Token verification is temporarily unavailable.",
    };
  }

  // 1) Personal API token (account → API tokens).
  try {
    const { data, error } = await supabase
      .from("api_tokens")
      .select("id, user_id, name, last_used_at, revoked_at")
      .eq("token_hash", hash)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      if (data.revoked_at) {
        return {
          ok: false,
          status: 401,
          code: "token_revoked",
          message: "This API token has been revoked.",
        };
      }
      throttledTouch("api_tokens", data.id, data.last_used_at);
      return {
        ok: true,
        remaining: limit.remaining,
        tokenId: data.id,
        userId: data.user_id,
        name: data.name,
        scopes: ["*"],
      };
    }
  } catch (error) {
    console.error("api token lookup failed", error);
    return {
      ok: false,
      status: 503,
      code: "auth_unavailable",
      message: "Token verification is temporarily unavailable.",
    };
  }

  // 2) OAuth 2.0 access token (issued by /oauth/token).
  try {
    const { data, error } = await supabase
      .from("oauth_tokens")
      .select(
        "id, user_id, scope, expires_at, last_used_at, revoked_at, client:oauth_clients(name, revoked_at)",
      )
      .eq("token_hash", hash)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return {
        ok: false,
        status: 401,
        code: "invalid_token",
        message: "The provided API token is not valid.",
      };
    }
    // PostgREST embeds are typed loosely — normalize to a single object.
    const client = Array.isArray(data.client)
      ? (data.client[0] ?? null)
      : data.client;
    if (data.revoked_at) {
      return {
        ok: false,
        status: 401,
        code: "token_revoked",
        message: "This access token has been revoked.",
      };
    }
    if (client?.revoked_at) {
      return {
        ok: false,
        status: 401,
        code: "token_revoked",
        message: "The application this token belongs to has been revoked.",
      };
    }
    if (Date.parse(data.expires_at) <= Date.now()) {
      return {
        ok: false,
        status: 401,
        code: "token_expired",
        message: "This access token has expired. Obtain a new one via /oauth/token.",
      };
    }

    const scopes = data.scope.split(/\s+/).filter(Boolean);
    if (!scopes.includes("*") && !scopes.includes(requiredScope)) {
      return {
        ok: false,
        status: 403,
        code: "insufficient_scope",
        message: `This token lacks the "${requiredScope}" scope.`,
      };
    }

    throttledTouch("oauth_tokens", data.id, data.last_used_at);
    return {
      ok: true,
      remaining: limit.remaining,
      tokenId: data.id,
      userId: data.user_id,
      name: client?.name ?? "OAuth application",
      scopes,
    };
  } catch (error) {
    console.error("oauth token lookup failed", error);
    return {
      ok: false,
      status: 503,
      code: "auth_unavailable",
      message: "Token verification is temporarily unavailable.",
    };
  }
}
