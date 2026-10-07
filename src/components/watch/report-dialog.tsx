"use client";

import { useState } from "react";
import { FlagIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReportDialog({
  mediaId,
  episode,
  provider,
  title,
}: {
  mediaId: number;
  episode: number;
  provider: string;
  title: string;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          anilistId: mediaId,
          episode,
          provider,
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Request failed");
      }
      toast.success("Report sent — thank you!");
      setMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send report");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" aria-label={`Report broken video for ${title}`} />
        }
      >
        <FlagIcon />
        Report
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report broken video</DialogTitle>
          <DialogDescription>
            Tell us what went wrong with {title}, episode {episode}
            {provider !== "none" ? ` on ${provider}` : ""}. No account needed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="report-message">What happened?</Label>
          <Textarea
            id="report-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. iframe stays blank, wrong episode, audio out of sync…"
            rows={4}
            required
            maxLength={1000}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => void submit()} disabled={sending || message.trim().length < 5}>
            {sending ? <Loader2Icon className="animate-spin" /> : <FlagIcon />}
            Send report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
