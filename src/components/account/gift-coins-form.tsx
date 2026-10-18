"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GiftIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { giftCoins } from "@/app/actions/gifting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GiftCoinsForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [isSaving, startSaving] = useTransition();

  const amountValue = Number(amount);
  const canSubmit =
    username.trim().length > 0 &&
    Number.isInteger(amountValue) &&
    amountValue >= 1 &&
    !isSaving;

  function submit() {
    if (!canSubmit) return;
    startSaving(async () => {
      const res = await giftCoins(username.trim(), amountValue);
      if (res.ok) {
        toast.success(res.message);
        setUsername("");
        setAmount("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-40 flex-1 space-y-1.5">
        <label htmlFor="gift-user" className="text-sm font-medium">
          Username
        </label>
        <Input
          id="gift-user"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Their username"
          maxLength={30}
        />
      </div>
      <div className="w-28 space-y-1.5">
        <label htmlFor="gift-amount" className="text-sm font-medium">
          Coins
        </label>
        <Input
          id="gift-amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="100"
          inputMode="numeric"
        />
      </div>
      <Button onClick={submit} disabled={!canSubmit} size="sm">
        {isSaving ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <GiftIcon />
        )}
        Send
      </Button>
    </div>
  );
}
