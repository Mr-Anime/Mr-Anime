"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SendIcon } from "lucide-react";
import { toast } from "sonner";
import { sendNotification } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  userCount: number;
};

export function NotificationSendForm({ userCount }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"all" | "user">("all");
  const [username, setUsername] = useState("");

  function submit() {
    startTransition(async () => {
      const res = await sendNotification({
        title,
        body,
        target: mode,
        username: mode === "user" ? username : undefined,
      });
      if (res.ok) {
        toast.success(res.message);
        setTitle("");
        setBody("");
        setUsername("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-border/60 bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="notif-title">Title</Label>
        <Input
          id="notif-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New feature unlocked!"
          maxLength={80}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notif-body">Message (optional)</Label>
        <Textarea
          id="notif-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell everyone what changed…"
          rows={3}
          maxLength={300}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notif-audience">Send to</Label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="notif-audience"
            value={mode}
            onChange={(e) => setMode(e.target.value as "all" | "user")}
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            <option value="all">All users ({userCount})</option>
            <option value="user">One user</option>
          </select>
          {mode === "user" ? (
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="h-9 w-44"
              maxLength={20}
              required
            />
          ) : null}
        </div>
      </div>

      <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
        <SendIcon />
        {isPending ? "Sending…" : "Send notification"}
      </Button>
    </form>
  );
}
