import "server-only";
import { createClient } from "@/lib/supabase/server";

export type OAuthAppRow = {
  id: string;
  name: string;
  client_id: string;
  redirect_uris: string[];
  logo_url: string | null;
  created_at: string;
};

/** Active (non-revoked) OAuth applications owned by the signed-in user. */
export async function getOAuthApps(): Promise<OAuthAppRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return [];

  const { data: rows, error } = await supabase
    .from("oauth_clients")
    .select("*")
    .eq("owner_user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getOAuthApps failed", error);
    return [];
  }
  return (rows ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    client_id: row.client_id as string,
    redirect_uris: (row.redirect_uris as string[]) ?? [],
    logo_url: (row.logo_url as string | null | undefined) ?? null,
    created_at: row.created_at as string,
  }));
}
