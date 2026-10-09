import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { siteConfig } from "@/lib/config";
import { sanitizeNextPath } from "@/lib/redirect";
import { tryCreateClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Mr.Anime account.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const supabase = await tryCreateClient();
  if (supabase) {
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) redirect("/");
  }

  const safeNext = sanitizeNextPath(next) ?? "/";

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to keep watching and manage your account."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-foreground underline-offset-4 hover:underline">
            Create one
          </a>
        </>
      }
    >
      <LoginForm
        next={safeNext}
        oauthProviders={siteConfig.oauthProviders}
        initialMessage={error}
      />
    </AuthShell>
  );
}
