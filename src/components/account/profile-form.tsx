"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { PaletteIcon, SparklesIcon } from "lucide-react";
import { updateProfile } from "@/app/actions/account";
import { FieldError, FormMessage } from "@/components/auth/auth-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarPickerDialog } from "@/components/avatar/avatar-picker-dialog";

type ProfileFormProps = {
  initialUsername: string;
  initialAvatarUrl?: string | null;
};

export function ProfileForm({ initialUsername, initialAvatarUrl }: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");

  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state?.message} success={state?.success} />

      {/* Avatar Picker Section */}
      <div className="space-y-2">
        <Label>Avatar</Label>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-3">
          <Avatar className="size-16 ring-2 ring-primary/20">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
            <AvatarFallback className="text-lg font-bold">
              {initialUsername.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <AvatarPickerDialog
                currentAvatarUrl={avatarUrl}
                onSelect={(newSrc) => setAvatarUrl(newSrc)}
                trigger={
                  <Button type="button" variant="outline" size="sm" className="gap-1.5">
                    <SparklesIcon className="size-3.5 text-sky-400" />
                    Choose Anime Avatar
                  </Button>
                }
              />
              {avatarUrl && avatarUrl !== initialAvatarUrl ? (
                <span className="text-[11px] font-medium text-amber-400">
                  ● Selection pending save
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Choose from 230+ official anime avatars across 20 series. Custom URLs and uploads are not allowed.
            </p>
          </div>
        </div>
        <input type="hidden" name="avatar_url" value={avatarUrl} />
        <FieldError errors={state?.errors?.avatar_url} />
      </div>

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

      <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Want animated themes, banners, titles, and flair?{" "}
        <Link href="/customize" className="inline-flex items-center gap-1 text-sky-400 hover:underline">
          <PaletteIcon className="size-3" />
          Customize profile →
        </Link>
      </p>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
