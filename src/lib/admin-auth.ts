import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AdminGate =
  | { status: "ok"; adminId: string }
  | { status: "signed-out" }
  | { status: "forbidden" }
  | { status: "unconfigured" };

/**
 * Server-side authority check for admin pages/actions.
 * Uses the caller's session (never the service role) to verify role.
 */
export async function adminGate(): Promise<AdminGate> {
  return roleGate(["admin"]);
}

/** Like adminGate, but also allows the moderator role (/moderator panel). */
export async function moderatorGate(): Promise<AdminGate> {
  return roleGate(["admin", "moderator"]);
}

async function roleGate(allowedRoles: string[]): Promise<AdminGate> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) return { status: "signed-out" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.claims.sub)
      .single();

    if (!profile) return { status: "forbidden" };
    if (!allowedRoles.includes(profile.role)) return { status: "forbidden" };
    return { status: "ok", adminId: data.claims.sub };
  } catch {
    // Supabase env not configured (local dev without credentials)
    return { status: "unconfigured" };
  }
}
