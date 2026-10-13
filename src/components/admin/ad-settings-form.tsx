"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setAdsSettings, type AdminActionResult } from "@/app/actions/admin";
import type { AdSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";

type Props = {
  initial: AdSettings;
};

const OPTIONS: {
  key: keyof AdSettings;
  label: string;
  description: string;
}[] = [
  {
    key: "banner",
    label: "Banner ads (728×90)",
    description:
      "Leaderboard banner between the page content and the footer on every page.",
  },
  {
    key: "social",
    label: "Social bar & popunder",
    description:
      "Lightweight social-bar script with popunder monetization. Loads on every page.",
  },
];

export function AdSettingsForm({ initial }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState<AdSettings>(initial);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res: AdminActionResult = await setAdsSettings(settings);
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
      router.refresh();
    });
  }

  return (
    <div className="max-w-xl space-y-4 rounded-lg border border-border/60 p-5">
      {OPTIONS.map((opt) => (
        <label
          key={opt.key}
          className="flex cursor-pointer items-start gap-3 rounded-md border border-border/40 p-4 transition-colors hover:bg-accent/40"
        >
          <input
            type="checkbox"
            checked={settings[opt.key]}
            onChange={(e) =>
              setSettings((s) => ({ ...s, [opt.key]: e.target.checked }))
            }
            className="mt-0.5 size-4 shrink-0 accent-sky-500"
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium">{opt.label}</span>
            <span className="block text-xs text-muted-foreground">
              {opt.description}
            </span>
          </span>
        </label>
      ))}

      <div className="flex items-center gap-3">
        <Button size="sm" disabled={isPending} onClick={save}>
          {isPending ? "Saving…" : "Save ad settings"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Applies site-wide within a few seconds. Off by default.
        </p>
      </div>
    </div>
  );
}
