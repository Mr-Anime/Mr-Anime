import "server-only";
import type { Cosmetics } from "@/lib/cosmetics";
import { createAdminClient } from "@/lib/supabase/admin";

type LoadoutRow = {
  user_id: string;
  frame: string | null;
  name_style: string | null;
  name_animation: string | null;
};

function toCosmetics(row: LoadoutRow): Cosmetics {
  return {
    frame: row.frame,
    nameStyle: row.name_style,
    nameAnimation: row.name_animation,
  };
}

/** Equipped cosmetics for many users (service role — loadouts are public). */
export async function getLoadouts(
  userIds: string[],
): Promise<Map<string, Cosmetics>> {
  const map = new Map<string, Cosmetics>();
  if (userIds.length === 0) return map;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("user_loadout")
      .select("user_id, frame, name_style, name_animation")
      .in("user_id", userIds);
    if (error) {
      console.error("[loadouts] query failed", error.message);
      return map;
    }
    for (const row of (data ?? []) as LoadoutRow[]) {
      map.set(row.user_id, toCosmetics(row));
    }
    return map;
  } catch (error) {
    console.error("[loadouts] query failed", error);
    return map;
  }
}

/** Equipped cosmetics for one user. */
export async function getLoadout(userId: string): Promise<Cosmetics | null> {
  const map = await getLoadouts([userId]);
  return map.get(userId) ?? null;
}
