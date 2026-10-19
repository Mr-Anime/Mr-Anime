"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, TicketIcon } from "lucide-react";
import { toast } from "sonner";
import { submitRedeemCode } from "@/app/actions/redeem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RedeemForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || !code.trim()) return;
    setPending(true);
    try {
      const res = await submitRedeemCode(code);
      if (res.ok) {
        toast.success(res.message);
        setCode("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="XXXX-XXXX-XXXX"
        className="h-10 w-full max-w-xs flex-1 font-mono tracking-widest"
        maxLength={64}
        autoComplete="off"
        spellCheck={false}
        aria-label="Redeem code"
      />
      <Button type="submit" disabled={pending || !code.trim()} className="h-10">
        {pending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <TicketIcon className="size-4" />
        )}
        Redeem
      </Button>
    </form>
  );
}
