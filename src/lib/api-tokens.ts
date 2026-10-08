import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ApiTokenRow = {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
};

/** Active (non-revoked) API tokens for the signed-in user, newest first. */
export async function getApiTokens(): Promise<ApiTokenRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return [];

  const { data: rows, error } = await supabase
    .from("api_tokens")
    .select("id, name, token_prefix, created_at, last_used_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getApiTokens failed", error);
    return [];
  }
  return (rows ?? []) as ApiTokenRow[];
}
