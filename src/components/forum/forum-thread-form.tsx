"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { createThread } from "@/app/actions/forum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ForumThreadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSaving, startSaving] = useTransition();

  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const canSubmit = trimmedTitle.length >= 3 && trimmedBody.length > 0 && !isSaving;

  function submit() {
    if (!canSubmit) return;
    startSaving(async () => {
      const res = await createThread(trimmedTitle, trimmedBody);
      if (res.ok) {
        toast.success(res.message);
        if (res.id) {
          router.push(`/forum/${res.id}`);
          router.refresh();
        }
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="thread-title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="thread-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you want to talk about?"
          maxLength={120}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="thread-body" className="text-sm font-medium">
          Body
        </label>
        <Textarea
          id="thread-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts…"
          rows={10}
          maxLength={10000}
          className="min-h-40"
        />
        <p className="text-xs text-muted-foreground">
          {trimmedBody.length} / 10000
        </p>
      </div>
      <Button onClick={submit} disabled={!canSubmit}>
        {isSaving ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <PlusIcon />
        )}
        Create thread
      </Button>
    </div>
  );
}
