import { cacheHeader, jsonError } from "@/lib/api";
import { isNitroActive } from "@/lib/nitro";
import { resolveUserFrame } from "@/lib/cosmetics";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

type Params = { params: Promise<{ username: string }> };

type LoadoutRow = {
  frame: string | null;
  name_style: string | null;
  name_animation: string | null;
};

type CoreProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  badges: string[];
  created_at: string;
  nitro_until?: string | null;
  loadout?: LoadoutRow[] | LoadoutRow | null;
};

const CORE_COLUMNS = "id, username, avatar_url, role, is_verified, badges, created_at";

/**
 * Public profile card for comment hover popouts (Discord-style card).
 * Degrades gracefully: if shop/nitro migrations aren't applied yet, the
 * embedded loadout / nitro_until columns are dropped and identity still
 * returns (hover always works).
 */
export async function GET(_request: Request, { params }: Params): Promise<Response> {
  const { username } = await params;
  const name = username.toLowerCase();
  if (!USERNAME_RE.test(name)) return jsonError("Invalid username", 400);

  try {
    const admin = createAdminClient();

    let row: CoreProfile | null = null;

    // 1) Full card: identity + Nitro expiry + equipped cosmetics.
    const full = await admin
      .from("profiles")
      .select(
        `${CORE_COLUMNS}, nitro_until, loadout:user_loadout(frame, name_style, name_animation)`,
      )
      .eq("username", name)
      .maybeSingle();
    if (!full.error && full.data) {
      row = full.data as unknown as CoreProfile;
    }

    // 2) Without loadout embed (shop migration missing).
    if (!row) {
      const noLoadout = await admin
        .from("profiles")
        .select(`${CORE_COLUMNS}, nitro_until`)
        .eq("username", name)
        .maybeSingle();
      if (!noLoadout.error && noLoadout.data) {
        row = noLoadout.data as unknown as CoreProfile;
      }
    }

    // 3) Minimal identity (core columns from 0001 — always present).
    if (!row) {
      const minimal = await admin
        .from("profiles")
        .select(CORE_COLUMNS)
        .eq("username", name)
        .maybeSingle();
      if (minimal.error) {
        console.error("[profile-card] lookup failed", minimal.error.message);
        return jsonError("Profile data is unavailable.", 503);
      }
      if (!minimal.data) return jsonError("Profile not found.", 404);
      row = minimal.data as unknown as CoreProfile;
    }

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
        nitro: isNitroActive({ badges: row.badges, nitro_until: row.nitro_until ?? null }),
        cosmetics: {
          frame: resolveUserFrame(row.username, loadout?.frame ?? null),
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
