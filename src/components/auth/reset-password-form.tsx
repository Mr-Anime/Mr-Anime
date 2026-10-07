"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";
import { FieldError, FormMessage } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  return (
    <form action={action} className="space-y-4">
      <FormMessage message={state?.message} />

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
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
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
