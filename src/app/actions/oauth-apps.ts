"use server";

import { revalidatePath } from "next/cache";
import { generateClientId, generateClientSecret } from "@/lib/oauth2";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { appNameSchema, redirectUriSchema } from "@/lib/validation";

export type OAuthAppActionResult =
  | { ok: true; message: string; clientId?: string; clientSecret?: string }
  | { ok: false; error: string };

const MAX_ACTIVE_APPS = 10;

type Guard =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; error: string };

async function guard(): Promise<Guard> {
  const ip = await clientIp();
  const ipLimit = rateLimit(`oauth-app:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!ipLimit.ok) {
    return { ok: false, error: "Too many app requests — wait a minute and try again." };
  }

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    const userId = authData?.claims?.sub;
    if (!userId) return { ok: false, error: "Sign in to manage OAuth applications." };
    return { ok: true, supabase, userId };
  } catch (error) {
    console.error("[oauth-apps] guard failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

/** Register an app. `urisRaw` is one redirect URI per line. The client
 *  secret is returned exactly once — only its hash is stored. */
export async function createOAuthApp(
  name: string,
  urisRaw: string,
): Promise<OAuthAppActionResult> {
  const g = await guard();
  if (!g.ok) return g;

  const parsedName = appNameSchema.safeParse(name);
  if (!parsedName.success) {
    return { ok: false, error: parsedName.error.issues[0]?.message ?? "Invalid app name." };
  }

  const lines = [...new Set(urisRaw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))];
  if (lines.length === 0) {
    return { ok: false, error: "Add at least one redirect URI (one per line)." };
  }
  if (lines.length > 10) {
    return { ok: false, error: "At most 10 redirect URIs per app." };
  }
  for (const [index, uri] of lines.entries()) {
    const parsedUri = redirectUriSchema.safeParse(uri);
    if (!parsedUri.success) {
      const message = parsedUri.error.issues[0]?.message ?? "Invalid redirect URI.";
      return { ok: false, error: `Line ${index + 1}: ${message}` };
    }
  }

  try {
    const { count, error: countError } = await g.supabase
      .from("oauth_clients")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", g.userId)
      .is("revoked_at", null);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_ACTIVE_APPS) {
      return {
        ok: false,
        error: `You can have at most ${MAX_ACTIVE_APPS} active apps — revoke one first.`,
      };
    }

    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const { error } = await g.supabase.from("oauth_clients").insert({
      owner_user_id: g.userId,
      name: parsedName.data,
      client_id: clientId.value,
      client_secret_hash: clientSecret.hash,
      redirect_uris: lines,
    });
    if (error) throw error;

    revalidatePath("/account");
    return {
      ok: true,
      clientId: clientId.value,
      clientSecret: clientSecret.value,
      message: "Application created.",
    };
  } catch (error) {
    console.error("[oauth-apps] create failed", error);
    return { ok: false, error: "Could not create the application. Try again." };
  }
}

/** Revoke (soft-delete) an app — its issued tokens stop working too. */
export async function revokeOAuthApp(id: string): Promise<OAuthAppActionResult> {
  const g = await guard();
  if (!g.ok) return g;

  try {
    const { data, error } = await g.supabase
      .from("oauth_clients")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("owner_user_id", g.userId)
      .is("revoked_at", null)
      .select("id");
    if (error) throw error;
    if (!data?.length) {
      return { ok: false, error: "Application not found." };
    }

    revalidatePath("/account");
    return { ok: true, message: "Application revoked." };
  } catch (error) {
    console.error("[oauth-apps] revoke failed", error);
    return { ok: false, error: "Could not revoke the application. Try again." };
  }
}
