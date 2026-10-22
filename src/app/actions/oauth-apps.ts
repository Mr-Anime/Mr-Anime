"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateClientId, generateClientSecret } from "@/lib/oauth2";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  appNameSchema,
  oauthLogoUrlSchema,
  redirectUriSchema,
} from "@/lib/validation";

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

function parseRedirectUris(
  urisRaw: string,
): { ok: true; uris: string[] } | { ok: false; error: string } {
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
  return { ok: true, uris: lines };
}

function logoColumnError(error: { code?: string; message?: string }): string | null {
  if (error.code === "PGRST204" || error.message?.includes("logo_url")) {
    return "Logo storage is not set up yet. Apply migration 0026_oauth_logos.sql.";
  }
  return null;
}

/** Register an app. `urisRaw` is one redirect URI per line. The client
 *  secret is returned exactly once — only its hash is stored. */
export async function createOAuthApp(
  name: string,
  urisRaw: string,
  logoUrlRaw = "",
): Promise<OAuthAppActionResult> {
  const g = await guard();
  if (!g.ok) return g;

  const parsedName = appNameSchema.safeParse(name);
  if (!parsedName.success) {
    return { ok: false, error: parsedName.error.issues[0]?.message ?? "Invalid app name." };
  }
  const parsedLogo = oauthLogoUrlSchema.safeParse(logoUrlRaw);
  if (!parsedLogo.success) {
    return { ok: false, error: parsedLogo.error.issues[0]?.message ?? "Invalid logo URL." };
  }
  const parsedUris = parseRedirectUris(urisRaw);
  if (!parsedUris.ok) return parsedUris;

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
    const payload: Record<string, unknown> = {
      owner_user_id: g.userId,
      name: parsedName.data,
      client_id: clientId.value,
      client_secret_hash: clientSecret.hash,
      redirect_uris: parsedUris.uris,
    };
    if (parsedLogo.data) payload.logo_url = parsedLogo.data;
    const { error } = await g.supabase.from("oauth_clients").insert(payload);
    if (error) {
      const logoError = logoColumnError(error);
      if (logoError) return { ok: false, error: logoError };
      throw error;
    }

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

/** Update an app's name, redirect URIs and logo URL. */
export async function updateOAuthApp(
  id: string,
  name: string,
  urisRaw: string,
  logoUrlRaw: string,
): Promise<OAuthAppActionResult> {
  const g = await guard();
  if (!g.ok) return g;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Application not found." };
  const parsedName = appNameSchema.safeParse(name);
  if (!parsedName.success) {
    return { ok: false, error: parsedName.error.issues[0]?.message ?? "Invalid app name." };
  }
  const parsedLogo = oauthLogoUrlSchema.safeParse(logoUrlRaw);
  if (!parsedLogo.success) {
    return { ok: false, error: parsedLogo.error.issues[0]?.message ?? "Invalid logo URL." };
  }
  const parsedUris = parseRedirectUris(urisRaw);
  if (!parsedUris.ok) return parsedUris;

  try {
    const updates = {
      name: parsedName.data,
      redirect_uris: parsedUris.uris,
      logo_url: parsedLogo.data || null,
    };
    let result = await g.supabase
      .from("oauth_clients")
      .update(updates)
      .eq("id", parsedId.data)
      .eq("owner_user_id", g.userId)
      .is("revoked_at", null)
      .select("id");

    // Before migration 0026, updates without a logo must still work.
    if (result.error && !parsedLogo.data && logoColumnError(result.error)) {
      result = await g.supabase
        .from("oauth_clients")
        .update({ name: parsedName.data, redirect_uris: parsedUris.uris })
        .eq("id", parsedId.data)
        .eq("owner_user_id", g.userId)
        .is("revoked_at", null)
        .select("id");
    }

    if (result.error) {
      const logoError = logoColumnError(result.error);
      if (logoError) return { ok: false, error: logoError };
      throw result.error;
    }
    if (!result.data?.length) {
      return { ok: false, error: "Application not found." };
    }

    revalidatePath("/account");
    return { ok: true, message: "Application updated." };
  } catch (error) {
    console.error("[oauth-apps] update failed", error);
    return { ok: false, error: "Could not update the application. Try again." };
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
