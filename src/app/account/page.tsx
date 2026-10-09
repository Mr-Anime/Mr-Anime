import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { ProfileForm } from "@/components/account/profile-form";
import { ApiTokenManager } from "@/components/account/api-token-manager";
import { OAuthAppsManager } from "@/components/account/oauth-apps-manager";
import { UserBadges } from "@/components/user-badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { getApiTokens } from "@/lib/api-tokens";
import { getOAuthApps } from "@/lib/oauth-apps";
import { tryCreateClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  badges: string[];
  created_at: string;
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;

  const supabase = await tryCreateClient();
  if (!supabase) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-28 text-center">
        <h1 className="text-xl font-semibold">Supabase is not configured</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
          <code className="font-mono">.env.local</code>.
        </p>
      </div>
    );
  }
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims) redirect("/login?next=/account");

  const { data } = await supabase
    .from("profiles")
    .select("id,username,avatar_url,role,is_verified,badges,created_at")
    .eq("id", authData.claims.sub)
    .single();

  if (!data) redirect("/login");

  const profile = data as unknown as Profile;
  const apiTokens = await getApiTokens();
  const oauthApps = await getOAuthApps();
  const email =
    typeof (authData.claims as Record<string, unknown>).email === "string"
      ? ((authData.claims as Record<string, unknown>).email as string)
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, security and account status.
        </p>
      </div>

      {reset === "done" ? (
        <p
          role="status"
          className="mb-6 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400"
        >
          Password updated successfully.
        </p>
      ) : null}

      <Card className="mb-6">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Avatar className="size-16">
            {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
            <AvatarFallback className="text-lg">
              {profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {profile.username}
              <UserBadges
                role={profile.role}
                isVerified={profile.is_verified}
                badges={profile.badges}
              />
            </CardTitle>
            <CardDescription>
              {email ?? "No email on file"} · Joined{" "}
              {new Date(profile.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Public details shown next to your name.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialUsername={profile.username}
              initialAvatarUrl={profile.avatar_url ?? ""}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Change your password.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
              <CardDescription>Sign out of this device.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={logout}>
                <Button type="submit" variant="destructive">
                  Sign out
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>API tokens</CardTitle>
          <CardDescription>
            Bearer tokens for the public REST API.{" "}
            <a href="/docs/api" className="text-sky-500 underline-offset-4 hover:underline">
              Read the API docs
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiTokenManager tokens={apiTokens} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>OAuth applications</CardTitle>
          <CardDescription>
            Apps that use Sign in with Mr.Anime or server-to-server API access.{" "}
            <a href="/docs/api" className="text-sky-500 underline-offset-4 hover:underline">
              Read the OAuth docs
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OAuthAppsManager apps={oauthApps} />
        </CardContent>
      </Card>
    </div>
  );
}
