import { authenticateApiRequest } from "@/lib/api-auth";
import {
  apiV1Error,
  apiV1Json,
  authFailureResponse,
  corsPreflight,
} from "@/lib/api-v1";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export function OPTIONS(): Response {
  return corsPreflight();
}

/**
 * Identity of the token's user — the "Sign in with Mr.Anime" endpoint.
 * Requires the `profile` scope (or a personal token). Never CDN-cached:
 * the response is per-user.
 */
export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateApiRequest(request, { scope: "profile" });
  if (!auth.ok) return authFailureResponse(auth);
  if (!auth.userId) {
    return apiV1Error(
      "insufficient_scope",
      "This token has no associated user (client_credentials).",
      403,
    );
  }

  let profile: {
    id: string;
    username: string;
    avatar_url: string | null;
    role: string;
    is_verified: boolean;
    badges: string[];
    created_at: string;
  } | null = null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, username, avatar_url, role, is_verified, badges, created_at")
      .eq("id", auth.userId)
      .maybeSingle();
    if (error) throw error;
    profile = data;
  } catch (error) {
    console.error("v1 me: profile lookup failed", error);
    return apiV1Error("upstream_error", "Could not load the profile.", 502);
  }

  if (!profile) {
    return apiV1Error("not_found", "No profile exists for this token's user.", 404);
  }

  return apiV1Json(
    {
      data: {
        id: profile.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        role: profile.role,
        isVerified: profile.is_verified,
        badges: profile.badges,
        joinedAt: profile.created_at,
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "X-RateLimit-Remaining": String(auth.remaining),
      },
    },
  );
}
