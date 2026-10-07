"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword } from "@/app/actions/auth";
import { FieldError, FormMessage } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPassword, undefined);

  if (state?.success) {
    return (
      <div className="space-y-4">
        <FormMessage success={state.success} />
        <Button render={<Link href="/login" />} variant="outline" className="w-full">
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FormMessage message={state?.message} />

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

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
