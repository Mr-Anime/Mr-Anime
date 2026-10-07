"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/account";
import { FieldError, FormMessage } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  initialUsername,
  initialAvatarUrl,
}: {
  initialUsername: string;
  initialAvatarUrl: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="space-y-4">
      <FormMessage message={state?.message} success={state?.success} />

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          defaultValue={initialUsername}
          required
          aria-invalid={Boolean(state?.errors?.username)}
        />
        <FieldError errors={state?.errors?.username} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input
          id="avatar_url"
          name="avatar_url"
          type="url"
          placeholder="https://…"
          defaultValue={initialAvatarUrl}
          aria-invalid={Boolean(state?.errors?.avatar_url)}
        />
        <FieldError errors={state?.errors?.avatar_url} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
