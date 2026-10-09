"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { FieldError, FormMessage } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OAuthProvider } from "@/lib/oauth";

export function RegisterForm({ oauthProviders }: { oauthProviders: OAuthProvider[] }) {
  const [state, action, pending] = useActionState(register, undefined);

  if (state?.success) {
    return (
      <div className="space-y-4">
        <FormMessage success={state.success} />
        <Button render={<Link href="/login" />} className="w-full">
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FormMessage message={state?.message} />

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          required
          placeholder="e.g. bazil"
          defaultValue={state?.values?.username}
          aria-invalid={Boolean(state?.errors?.username)}
        />
        <p className="text-xs text-muted-foreground">
          3–20 characters: a-z, 0-9 and underscores.
        </p>
        <FieldError errors={state?.errors?.username} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          defaultValue={state?.values?.email}
          aria-invalid={Boolean(state?.errors?.email)}
        />
        <FieldError errors={state?.errors?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          aria-invalid={Boolean(state?.errors?.password)}
        />
        <FieldError errors={state?.errors?.password} />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <OAuthButtons providers={oauthProviders} next="/" />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
