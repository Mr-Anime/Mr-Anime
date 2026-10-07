"use client";

import Link from "next/link";
import { useActionState } from "react";
import { toast } from "sonner";
import { login } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { FieldError, FormMessage } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  next,
  googleEnabled,
  initialMessage,
}: {
  next: string;
  googleEnabled: boolean;
  initialMessage?: string;
}) {
  const [state, action, pending] = useActionState(login, undefined);

  async function signInWithGoogle() {
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
    } catch {
      toast.error("Google sign-in is not configured on this server.");
    }
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <FormMessage message={initialMessage ?? state?.message} success={state?.success} />

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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          aria-invalid={Boolean(state?.errors?.password)}
        />
        <FieldError errors={state?.errors?.password} />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      {googleEnabled ? (
        <>
          <div className="relative py-1 text-center text-xs text-muted-foreground">
            <span className="relative z-10 bg-card px-2">or</span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => void signInWithGoogle()}
          >
            Continue with Google
          </Button>
        </>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
