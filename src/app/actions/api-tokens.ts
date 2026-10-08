"use server";

import { revalidatePath } from "next/cache";
import { generateToken } from "@/lib/api-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { apiTokenNameSchema } from "@/lib/validation";

export type ApiTokenActionResult =
  | { ok: true; token?: string; message: string }
  | { ok: false; error: string };

const MAX_ACTIVE_TOKENS = 10;

type Guard =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; error: string };

async function guard(): Promise<Guard> {
  const ip = await clientIp();
  const ipLimit = rateLimit(`api-token:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!ipLimit.ok) {
    return { ok: false, error: "Too many token requests — wait a minute and try again." };
  }

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    const userId = authData?.claims?.sub;
    if (!userId) return { ok: false, error: "Sign in to manage API tokens." };
    return { ok: true, supabase, userId };
  } catch (error) {
    console.error("[api-tokens] guard failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

/** Create a new API token. The plaintext token is returned exactly once. */
export async function createApiToken(name: string): Promise<ApiTokenActionResult> {
  const g = await guard();
  if (!g.ok) return g;

  const parsedName = apiTokenNameSchema.safeParse(name);
  if (!parsedName.success) {
    return { ok: false, error: parsedName.error.issues[0]?.message ?? "Invalid token name." };
  }

  try {
    const { count, error: countError } = await g.supabase
      .from("api_tokens")
      .select("id", { count: "exact", head: true })
      .eq("user_id", g.userId)
      .is("revoked_at", null);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_ACTIVE_TOKENS) {
      return {
        ok: false,
        error: `You can have at most ${MAX_ACTIVE_TOKENS} active tokens — revoke one first.`,
      };
    }

    const { token, hash, prefix } = generateToken();
    const { error } = await g.supabase.from("api_tokens").insert({
      user_id: g.userId,
      name: parsedName.data,
      token_hash: hash,
      token_prefix: prefix,
    });
    if (error) throw error;

    revalidatePath("/account");
    return { ok: true, token, message: "Token created." };
  } catch (error) {
    console.error("[api-tokens] create failed", error);
    return { ok: false, error: "Could not create the token. Try again." };
  }
}

/** Revoke (soft-delete) an API token. Revoked tokens stop working immediately. */
export async function revokeApiToken(id: string): Promise<ApiTokenActionResult> {
  const g = await guard();
  if (!g.ok) return g;

  try {
    const { data, error } = await g.supabase
      .from("api_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", g.userId)
      .is("revoked_at", null)
      .select("id");
    if (error) throw error;
    if (!data?.length) {
      return { ok: false, error: "Token not found." };
    }

    revalidatePath("/account");
    return { ok: true, message: "Token revoked." };
  } catch (error) {
    console.error("[api-tokens] revoke failed", error);
    return { ok: false, error: "Could not revoke the token. Try again." };
  }
}
