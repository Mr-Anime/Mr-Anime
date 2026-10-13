"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SendIcon } from "lucide-react";
import { toast } from "sonner";
import { sendNotification } from "@/app/actions/admin";
import { NotificationText, NOTIFICATION_COLORS } from "@/components/notifications/notification-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  userCount: number;
};

const COLOR_ENTRIES = Object.entries(NOTIFICATION_COLORS) as [
  keyof typeof NOTIFICATION_COLORS,
  string,
][];

export function NotificationSendForm({ userCount }: Props) {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"all" | "user">("all");
  const [username, setUsername] = useState("");

  function wrapColor(name: string) {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd);
    const open = `[${name}]`;
    const close = `[/${name}]`;
    const next =
      value.slice(0, selectionStart) + open + selected + close + value.slice(selectionEnd);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = selected
        ? selectionStart + open.length + selected.length + close.length
        : selectionStart + open.length;
      el.setSelectionRange(caret, caret);
    });
  }

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
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell everyone what changed…"
          rows={3}
          maxLength={500}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Colour:</span>
          {COLOR_ENTRIES.map(([name, hex]) => (
            <button
              key={name}
              type="button"
              onClick={() => wrapColor(name)}
              className="rounded border border-border/50 px-1.5 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80"
              style={{ color: hex }}
              title={`Wrap selection in [${name}]…[/${name}]`}
            >
              {name}
            </button>
          ))}
          <span className="text-[11px] text-muted-foreground">
            — select text first, or click to insert tags
          </span>
        </div>
        {body ? (
          <div className="rounded-md border border-border/40 bg-background/50 p-3">
            <p className="mb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Preview
            </p>
            <NotificationText text={body} className="text-sm whitespace-pre-wrap" />
          </div>
        ) : null}
        <p className="text-[11px] text-muted-foreground">
          URLs become links, @username mentions members. Max 500 chars (tags included).
        </p>
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
        <SendIcon className={cn(isPending && "animate-pulse")} />
        {isPending ? "Sending…" : "Send notification"}
      </Button>
    </form>
  );
}
