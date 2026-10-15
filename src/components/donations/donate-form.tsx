"use client";

import { useState, useTransition } from "react";
import { HeartHandshakeIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { createDonation } from "@/app/actions/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";

const PRESETS = [1, 5, 10, 25, 50];

export function DonateForm() {
  const [amount, setAmount] = useState<number>(5);
  const [custom, setCustom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, startSaving] = useTransition();

  const customValue = Number(custom);
  const activeAmount =
    custom.trim() !== "" && Number.isFinite(customValue) && customValue > 0
      ? customValue
      : amount;
  const canSubmit = activeAmount >= 1 && activeAmount <= 10000 && !isSaving;

  function submit() {
    if (!canSubmit) return;
    startSaving(async () => {
      const res = await createDonation({
        amount: activeAmount,
        email: email.trim() || undefined,
        message: message.trim() || undefined,
      });
      if (res.ok) {
        toast.success(res.message);
        window.location.href = res.url;
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium">Amount (USD)</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((value) => (
            <Button
              key={value}
              variant={custom.trim() === "" && amount === value ? "default" : "outline"}
              size="sm"
              className="min-w-14"
              onClick={() => {
                setAmount(value);
                setCustom("");
              }}
            >
              ${value}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">$</span>
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="Custom amount"
            inputMode="decimal"
            className="max-w-40"
            aria-label="Custom amount"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Paying with crypto via OxaPay · 1 – 10,000 USD
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="donate-email" className="text-sm font-medium">
          Email <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="donate-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="donate-message" className="text-sm font-medium">
          Message <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="donate-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say something nice…"
          rows={3}
          maxLength={300}
        />
        <p className="text-xs text-muted-foreground">{message.length} / 300</p>
      </div>

      <Button
        onClick={submit}
        disabled={!canSubmit}
        className={cn("w-full sm:w-auto")}
      >
        {isSaving ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <HeartHandshakeIcon />
        )}
        Donate ${activeAmount >= 1 ? activeAmount.toFixed(activeAmount % 1 === 0 ? 0 : 2) : 0}
      </Button>
    </div>
  );
}
