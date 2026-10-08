import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/** Token issuance + verification for the public REST API (/api/v1). */

export const TOKEN_PREFIX = "ma_live_";
const RATE_LIMIT = { limit: 60, windowMs: 60_000 };

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(): { token: string; hash: string; prefix: string } {
  const token = TOKEN_PREFIX + randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token), prefix: token.slice(0, 15) };
}

export type ApiAuthSuccess = {
  ok: true;
  remaining: number;
  tokenId: string;
  userId: string;
  name: string;
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

/**
 * Validates the request's bearer token: format, rate limit, DB lookup
 * (service role bypasses RLS; only the SHA-256 hash is stored).
 */
export async function authenticateApiRequest(request: Request): Promise<ApiAuthResult> {
  const token = bearerFrom(request);
  if (!token || !token.startsWith(TOKEN_PREFIX) || token.length > 200) {
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

  let row: {
    id: string;
    user_id: string;
    name: string;
    last_used_at: string | null;
    revoked_at: string | null;
  } | null = null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("api_tokens")
      .select("id, user_id, name, last_used_at, revoked_at")
      .eq("token_hash", hash)
      .maybeSingle();
    if (error) throw error;
    row = data;
  } catch (error) {
    console.error("api token lookup failed", error);
    return {
      ok: false,
      status: 503,
      code: "auth_unavailable",
      message: "Token verification is temporarily unavailable.",
    };
  }

  if (!row) {
    return {
      ok: false,
      status: 401,
      code: "invalid_token",
      message: "The provided API token is not valid.",
    };
  }
  if (row.revoked_at) {
    return {
      ok: false,
      status: 401,
      code: "token_revoked",
      message: "This API token has been revoked.",
    };
  }

  // Best-effort last-used bookkeeping, at most once a minute.
  const lastUsed = row.last_used_at ? Date.parse(row.last_used_at) : 0;
  if (Date.now() - lastUsed > 60_000) {
    void createAdminClient()
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", row.id)
      .then(({ error }) => {
        if (error) console.error("api token last_used update failed", error);
      });
  }

  return {
    ok: true,
    remaining: limit.remaining,
    tokenId: row.id,
    userId: row.user_id,
    name: row.name,
  };
}
