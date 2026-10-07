"use server";

import { revalidatePath } from "next/cache";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  changePasswordSchema,
  flattenErrors,
  updateProfileSchema,
} from "@/lib/validation";
import type { AuthFormState } from "@/lib/validation";

export async function updateProfile(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await clientIp();
  const limited = rateLimit(`profile:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!limited.ok) {
    return { message: "Too many updates. Please wait a minute." };
  }

  const parsed = updateProfileSchema.safeParse({
    username: formData.get("username"),
    avatar_url: formData.get("avatar_url") ?? "",
  });
  if (!parsed.success) {
    return { errors: flattenErrors(parsed.error) };
  }

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    if (!authData?.claims) {
      return { message: "Your session expired. Please sign in again." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: parsed.data.username,
        avatar_url: parsed.data.avatar_url || null,
      })
      .eq("id", authData.claims.sub);

    if (error) {
      if (error.code === "23505") {
        return { errors: { username: ["That username is already taken."] } };
      }
      if (error.message.includes("protected profile columns")) {
        return { message: "That field cannot be changed." };
      }
      return { message: "Could not save your profile. Try a different username." };
    }

    revalidatePath("/account");
    return { success: "Profile updated." };
  } catch (error) {
    console.error("update profile failed", error);
    return { message: "Something went wrong. Please try again." };
  }
}

export async function changePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await clientIp();
  const limited = rateLimit(`password:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limited.ok) {
    return { message: "Too many attempts. Please wait a few minutes." };
  }

  const parsed = changePasswordSchema.safeParse({
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
    if (error) return { message: error.message };

    return { success: "Password changed." };
  } catch (error) {
    console.error("change password failed", error);
    return { message: "Something went wrong. Please try again." };
  }
}
