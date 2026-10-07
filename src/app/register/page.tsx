import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { tryCreateClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free Mr.Anime account.",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const supabase = await tryCreateClient();
  if (supabase) {
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) redirect("/");
  }

  return (
    <AuthShell
      title="Create your account"
      description="Free forever. Save your username and get verified."
      footer={
        <>
          Already registered?{" "}
          <a href="/login" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </a>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
