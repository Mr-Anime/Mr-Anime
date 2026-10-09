import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { handleOAuthConsent } from "@/app/actions/oauth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OAUTH_SCOPES, parseScopes } from "@/lib/oauth2";
import { isAllowedRedirectUri } from "@/lib/redirect";
import { tryCreateClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Authorize application",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  read: "Read anime data — search, details, episodes and player URLs.",
  profile: "See your basic profile — username, avatar and badges.",
};

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Authorization error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

type AuthorizeSearchParams = {
  client_id?: string;
  redirect_uri?: string;
  response_type?: string;
  scope?: string;
  state?: string;
  error?: string;
};

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<AuthorizeSearchParams>;
}) {
  const sp = await searchParams;
  const clientId = sp.client_id?.trim() ?? "";
  const redirectUri = sp.redirect_uri?.trim() ?? "";
  const scope = sp.scope?.trim() ?? "";
  const state = sp.state ?? "";

  if (!clientId || !redirectUri) {
    return (
      <ErrorCard message="Missing client_id or redirect_uri in the authorization request." />
    );
  }

  let client: { id: string; name: string; redirect_uris: string[] } | null = null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("oauth_clients")
      .select("id, name, redirect_uris")
      .eq("client_id", clientId)
      .is("revoked_at", null)
      .maybeSingle();
    if (error) throw error;
    client = data;
  } catch (err) {
    console.error("oauth authorize: client lookup failed", err);
    return <ErrorCard message="Authorization is temporarily unavailable. Try again later." />;
  }

  if (!client) {
    return <ErrorCard message="Unknown or revoked application." />;
  }
  if (!client.redirect_uris.includes(redirectUri) || !isAllowedRedirectUri(redirectUri)) {
    return (
      <ErrorCard message="redirect_uri is not one of the URIs registered by this application." />
    );
  }

  const oauthErrorRedirect = (errorCode: string) => {
    const url = new URL(redirectUri);
    url.searchParams.set("error", errorCode);
    if (state) url.searchParams.set("state", state);
    redirect(url.toString());
  };

  if (sp.response_type !== "code") {
    oauthErrorRedirect("unsupported_response_type");
  }
  const scopes = parseScopes(scope);
  if (!scopes || scopes.length === 0) {
    oauthErrorRedirect("invalid_scope");
  }

  const supabase = await tryCreateClient();
  const authData = supabase ? (await supabase.auth.getClaims()).data : null;
  const userId = authData?.claims?.sub;
  const authorizeUrl = `/oauth/authorize?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    ...(state ? { state } : {}),
  }).toString()}`;
  if (!userId) {
    redirect(`/login?next=${encodeURIComponent(authorizeUrl)}`);
  }

  let username: string | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();
    username = data?.username ?? null;
  } catch {
    // non-essential — the consent screen works without a display name
  }

  const origin = (() => {
    try {
      return new URL(redirectUri).host;
    } catch {
      return redirectUri;
    }
  })();

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Authorize {client.name}</CardTitle>
          <CardDescription>
            {client.name} wants to access your Mr.Anime account
            {username ? (
              <>
                {" "}
                (<span className="text-foreground">{username}</span>)
              </>
            ) : null}
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {sp.error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {sp.error}
            </p>
          ) : null}

          <ul className="space-y-2 rounded-md border border-border/60 p-3">
            {scopes?.map((s) => (
              <li key={s} className="flex gap-2 text-sm">
                <span className="font-mono text-sky-500">{s}</span>
                <span className="text-muted-foreground">
                  {SCOPE_DESCRIPTIONS[s] ?? s}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">
            It will be redirected to{" "}
            <span className="break-all font-mono">{origin}</span>. You can revoke this app at any
            time from your account page.
          </p>

          <form action={handleOAuthConsent}>
            <input type="hidden" name="client_id" value={clientId} />
            <input type="hidden" name="redirect_uri" value={redirectUri} />
            <input type="hidden" name="scope" value={scope} />
            <input type="hidden" name="state" value={state} />
            <div className="flex gap-3">
              <Button type="submit" name="decision" value="approve" className="flex-1">
                Approve
              </Button>
              <Button
                type="submit"
                name="decision"
                value="deny"
                variant="outline"
                className="flex-1"
              >
                Deny
              </Button>
            </div>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Scopes: <span className="font-mono">{OAUTH_SCOPES.join(" · ")}</span> ·{" "}
            <Link href="/docs/api" className="underline-offset-4 hover:underline">
              API docs
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
