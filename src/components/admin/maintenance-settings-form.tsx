"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setMaintenanceBannerEnabled } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function MaintenanceSettingsForm({ initial }: { initial: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await setMaintenanceBannerEnabled(enabled);
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
      router.refresh();
    });
  }

  return (
    <div className="max-w-xl space-y-4 rounded-lg border border-border/60 p-5">
      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border/40 p-4 transition-colors hover:bg-accent/40">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-sky-500"
        />
        <span className="space-y-1">
          <span className="block text-sm font-medium">Show maintenance warning banner</span>
          <span className="block text-xs text-muted-foreground">
            Red sitewide bar at the top of every page with the “Site is in maintenance mode”
            message and a link to stats.mranime.cyou.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <Button size="sm" disabled={isPending || enabled === initial} onClick={save}>
          {isPending ? "Saving…" : "Save banner setting"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Currently {initial ? "visible" : "hidden"}.
        </p>
      </div>
    </div>
  );
}
