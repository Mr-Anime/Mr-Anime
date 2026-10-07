import "server-only";
import { tryCreateClient } from "@/lib/supabase/server";
import type { ListEntry } from "@/lib/list-shared";

export type { ListEntry, ListStatus } from "@/lib/list-shared";

const SELECT = "anilist_id, status, episodes_watched, updated_at";

/**
 * The signed-in viewer's list entry for one anime.
 * Returns null when signed out, Supabase is unconfigured, or not on the list.
 */
export async function getListEntry(anilistId: number): Promise<ListEntry | null> {
  const supabase = await tryCreateClient();
  if (!supabase) return null;

  try {
    const { data: authData } = await supabase.auth.getClaims();
    const sub = authData?.claims?.sub;
    if (!sub) return null;

    const { data, error } = await supabase
      .from("user_list_entries")
      .select(SELECT)
      .eq("user_id", sub)
      .eq("anilist_id", anilistId)
      .maybeSingle();
    if (error) {
      console.error("[list] entry query failed", error.message);
      return null;
    }
    return (data as unknown as ListEntry | null) ?? null;
  } catch (error) {
    console.error("[list] entry query failed", error);
    return null;
  }
}

/**
 * All of the viewer's list entries, most recently updated first.
 * Returns null when signed out / Supabase unconfigured (used to redirect).
 */
export async function getListEntries(): Promise<ListEntry[] | null> {
  const supabase = await tryCreateClient();
  if (!supabase) return null;

  try {
    const { data: authData } = await supabase.auth.getClaims();
    const sub = authData?.claims?.sub;
    if (!sub) return null;

    const { data, error } = await supabase
      .from("user_list_entries")
      .select(SELECT)
      .eq("user_id", sub)
      .order("updated_at", { ascending: false })
      .limit(1000);
    if (error) {
      console.error("[list] entries query failed", error.message);
      return [];
    }
    return (data ?? []) as unknown as ListEntry[];
  } catch (error) {
    console.error("[list] entries query failed", error);
    return null;
  }
}
