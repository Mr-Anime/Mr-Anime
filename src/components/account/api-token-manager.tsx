"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createApiToken, revokeApiToken } from "@/app/actions/api-tokens";
import type { ApiTokenActionResult } from "@/app/actions/api-tokens";
import type { ApiTokenRow } from "@/lib/api-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatDate(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CreateTokenForm() {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function runAction(_prev: ApiTokenActionResult | null, formData: FormData) {
    setDismissed(false);
    setCopied(false);
    return createApiToken(String(formData.get("name") ?? ""));
  }

  const [state, action, pending] = useActionState<ApiTokenActionResult | null, FormData>(
    runAction,
    null,
  );

  const plaintext = state?.ok ? state.token : undefined;

  async function copyToken() {
    if (!plaintext) return;
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      {state && !state.ok ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {plaintext && !dismissed ? (
        <div role="status" className="space-y-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3">
          <p className="text-sm font-medium text-emerald-400">
            Copy your token now — it will not be shown again.
          </p>
          <code className="block break-all rounded-md bg-background/70 p-2 font-mono text-xs">
            {plaintext}
          </code>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={copyToken}>
              {copied ? "Copied!" : "Copy token"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      <form action={action} className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1 space-y-2">
          <Label htmlFor="api-token-name">Token name</Label>
          <Input
            id="api-token-name"
            name="name"
            required
            maxLength={60}
            placeholder="e.g. my-bot"
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create token"}
        </Button>
      </form>
    </div>
  );
}

function RevokeTokenButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState<ApiTokenActionResult | null, FormData>(
    async (_prev, formData) => revokeApiToken(String(formData.get("id") ?? "")),
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

export function ApiTokenManager({ tokens }: { tokens: ApiTokenRow[] }) {
  return (
    <div className="space-y-6">
      <CreateTokenForm />

      {tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tokens yet. Create one above to start using the API.{" "}
          <Link href="/docs/api" className="text-sky-500 underline-offset-4 hover:underline">
            Read the API docs
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-md border border-border/60">
          {tokens.map((token) => (
            <li
              key={token.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">{token.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {token.token_prefix}…
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(token.created_at)} · Last used{" "}
                  {formatDate(token.last_used_at)}
                </p>
              </div>
              <RevokeTokenButton id={token.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
