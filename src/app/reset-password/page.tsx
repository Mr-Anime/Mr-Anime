import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { tryCreateClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Choose a new password for your Mr.Anime account.",
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const supabase = await tryCreateClient();
  const { data } = supabase
    ? await supabase.auth.getClaims()
    : { data: null };
  if (!data?.claims) redirect("/forgot-password");

  return (
    <AuthShell
      title="Set a new password"
      description="Your new password replaces the old one immediately."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
