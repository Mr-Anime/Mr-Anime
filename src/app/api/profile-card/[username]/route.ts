import { cacheHeader, jsonError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

type Params = { params: Promise<{ username: string }> };

type LoadoutRow = {
  frame: string | null;
  name_style: string | null;
  name_animation: string | null;
};

type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  badges: string[];
  created_at: string;
  loadout: LoadoutRow[] | LoadoutRow | null;
};

/**
 * Public profile card for comment hover popouts (Discord-style card):
 * identity + badges + equipped shop cosmetics. Anonymous, short CDN cache.
 */
export async function GET(_request: Request, { params }: Params): Promise<Response> {
  const { username } = await params;
  const name = username.toLowerCase();
  if (!USERNAME_RE.test(name)) return jsonError("Invalid username", 400);

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select(
        "id, username, avatar_url, role, is_verified, badges, created_at, " +
          "loadout:user_loadout(frame, name_style, name_animation)",
      )
      .eq("username", name)
      .maybeSingle();
    if (error) {
      console.error("[profile-card] lookup failed", error.message);
      return jsonError("Profile data is unavailable.", 503);
    }
    if (!data) return jsonError("Profile not found.", 404);

    // Embedded to-one relations come back as arrays in PostgREST.
    const row = data as unknown as ProfileRow;
    const rawLoadout = row.loadout;
    const loadout = (Array.isArray(rawLoadout) ? rawLoadout[0] : rawLoadout) as
      | LoadoutRow
      | null
      | undefined;

    return Response.json(
      {
        username: row.username,
        avatarUrl: row.avatar_url,
        role: row.role,
        isVerified: row.is_verified,
        badges: row.badges ?? [],
        joinedAt: row.created_at,
        cosmetics: {
          frame: loadout?.frame ?? null,
          nameStyle: loadout?.name_style ?? null,
          nameAnimation: loadout?.name_animation ?? null,
        },
      },
      { headers: cacheHeader(60) },
    );
  } catch (error) {
    console.error("[profile-card] lookup failed", error);
    return jsonError("Profile data is unavailable.", 503);
  }
}
