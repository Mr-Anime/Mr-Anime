"use server";

import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/config";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  flattenErrors,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation";
import type { AuthFormState } from "@/lib/validation";
import { sanitizeNextPath } from "@/lib/redirect";

const callbackUrl = (next: string) =>
  `${siteConfig.url}/auth/callback?next=${encodeURIComponent(next)}`;

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Incorrect email or password.";
  if (m.includes("already registered")) return "An account with this email already exists.";
  if (m.includes("email not confirmed")) return "Please confirm your email first.";
  if (m.includes("password")) return message;
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return message;
}

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await clientIp();
  const limited = rateLimit(`register:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limited.ok) {
    return { message: "Too many sign-up attempts. Please try again later." };
  }

  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      errors: flattenErrors(parsed.error),
      values: {
        username: String(formData.get("username") ?? ""),
        email: String(formData.get("email") ?? ""),
      },
    };
  }

  const { username, email, password } = parsed.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: callbackUrl("/"),
      },
    });

    if (error) return { message: friendlyAuthError(error.message) };

    // No identities means the email already exists (confirmed account)
    if (data.user && data.user.identities?.length === 0) {
      return { message: "An account with this email already exists." };
    }

    if (data.session) {
      redirect("/");
    }

    return {
      success: "Almost there — check your inbox to confirm your email, then sign in.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("register failed", error);
    return { message: "Something went wrong creating your account. Try again." };
  }
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await clientIp();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const ipLimit = rateLimit(`login:ip:${ip}`, { limit: 15, windowMs: 5 * 60_000 });
  const emailLimit = rateLimit(`login:email:${email}`, {
    limit: 5,
    windowMs: 5 * 60_000,
  });
  if (!ipLimit.ok || !emailLimit.ok) {
    return { message: "Too many sign-in attempts. Please wait a few minutes." };
  }

  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    return {
      errors: flattenErrors(parsed.error),
      values: { email },
    };
  }

  const next = sanitizeNextPath(String(formData.get("next") ?? "")) ?? "/";

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) return { message: friendlyAuthError(error.message) };

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_banned, ban_reason")
      .eq("id", data.user.id)
      .single();

    if (profile?.is_banned) {
      await supabase.auth.signOut();
      redirect(`/suspended?r=${encodeURIComponent(profile.ban_reason ?? "No reason recorded.")}`);
    }

    redirect(next);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("login failed", error);
    return { message: "Unable to sign in right now. Please try again." };
  }
}

export async function forgotPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await clientIp();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const limited = rateLimit(`forgot:${ip}:${email}`, {
    limit: 3,
    windowMs: 10 * 60_000,
  });
  if (!limited.ok) {
    return { message: "Too many reset requests. Please wait a few minutes." };
  }

  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { errors: flattenErrors(parsed.error), values: { email } };
  }

  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: callbackUrl("/reset-password"),
    });
    // Always show the same message so accounts cannot be enumerated.
    return {
      success: "If that email exists, a reset link is on its way.",
    };
  } catch (error) {
    console.error("forgot password failed", error);
    return { message: "Unable to send the reset email right now. Try again." };
  }
}

export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: flattenErrors(parsed.error) };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) return { message: friendlyAuthError(error.message) };

    redirect("/account?reset=done");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("reset password failed", error);
    return { message: "Unable to update your password. Please try again." };
  }
}

export async function logout(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("logout failed", error);
  }
  redirect("/login");
}

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
