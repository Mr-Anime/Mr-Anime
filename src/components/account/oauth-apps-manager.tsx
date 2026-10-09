"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createOAuthApp, revokeOAuthApp } from "@/app/actions/oauth-apps";
import type { OAuthAppActionResult } from "@/app/actions/oauth-apps";
import type { OAuthAppRow } from "@/lib/oauth-apps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CreateAppForm() {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function runAction(_prev: OAuthAppActionResult | null, formData: FormData) {
    setDismissed(false);
    setCopied(null);
    return createOAuthApp(
      String(formData.get("name") ?? ""),
      String(formData.get("uris") ?? ""),
    );
  }

  const [state, action, pending] = useActionState<OAuthAppActionResult | null, FormData>(
    runAction,
    null,
  );

  const credentials =
    state?.ok && state.clientId && state.clientSecret
      ? { id: state.clientId, secret: state.clientSecret }
      : null;

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="space-y-4">
      {state && !state.ok ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      {credentials && !dismissed ? (
        <div
          role="status"
          className="space-y-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3"
        >
          <p className="text-sm font-medium text-emerald-400">
            Copy these now — the client secret is not shown again.
          </p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">client_id</p>
            <code className="block break-all rounded-md bg-background/70 p-2 font-mono text-xs">
              {credentials.id}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void copy(credentials.id, "id")}
            >
              {copied === "id" ? "Copied!" : "Copy client_id"}
            </Button>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">client_secret</p>
            <code className="block break-all rounded-md bg-background/70 p-2 font-mono text-xs">
              {credentials.secret}
            </code>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void copy(credentials.secret, "secret")}
              >
                {copied === "secret" ? "Copied!" : "Copy client_secret"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setDismissed(true)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <form action={action} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="app-name">App name</Label>
          <Input
            id="app-name"
            name="name"
            required
            maxLength={80}
            placeholder="e.g. My Anime Tracker"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="app-uris">Redirect URIs</Label>
          <Textarea
            id="app-uris"
            name="uris"
            required
            rows={3}
            placeholder={"https://your-app.example/auth/callback\nhttp://localhost:3000/callback"}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            One URI per line — https only (http://localhost for development).
          </p>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create application"}
        </Button>
      </form>
    </div>
  );
}

function RevokeAppButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState<OAuthAppActionResult | null, FormData>(
    async (_prev, formData) => revokeOAuthApp(String(formData.get("id") ?? "")),
    null,
  );

  if (state && state.ok) return null;

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {state && !state.ok ? (
        <span className="text-xs text-destructive">{state.error}</span>
      ) : null}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Revoking…" : "Revoke"}
      </Button>
    </form>
  );
}

export function OAuthAppsManager({ apps }: { apps: OAuthAppRow[] }) {
  return (
    <div className="space-y-6">
      <CreateAppForm />

      {apps.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No applications yet. Create one above to integrate{" "}
          <Link href="/docs/api" className="text-sky-500 underline-offset-4 hover:underline">
            Sign in with Mr.Anime
          </Link>{" "}
          or server-side API access.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-md border border-border/60">
          {apps.map((app) => (
            <li key={app.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">{app.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{app.client_id}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {app.redirect_uris.length} redirect URI
                  {app.redirect_uris.length === 1 ? "" : "s"} · Created {formatDate(app.created_at)}
                </p>
              </div>
              <RevokeAppButton id={app.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
