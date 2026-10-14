"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { createPost } from "@/app/actions/forum";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ForumReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSaving, startSaving] = useTransition();

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0 && !isSaving;

  function submit() {
    if (!canSubmit) return;
    startSaving(async () => {
      const res = await createPost(threadId, trimmed);
      if (res.ok) {
        toast.success(res.message);
        setBody("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply…"
        rows={4}
        maxLength={8000}
        aria-label="Reply"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{trimmed.length} / 8000</p>
        <Button onClick={submit} disabled={!canSubmit}>
          {isSaving ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <SendIcon />
          )}
          Reply
        </Button>
      </div>
    </div>
  );
}
