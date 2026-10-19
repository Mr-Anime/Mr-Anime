"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CopyIcon,
  Loader2Icon,
  PlusIcon,
  PowerIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import {
  createRedeemCode,
  deleteRedeemCode,
  toggleRedeemCode,
} from "@/app/actions/redeem-admin";
import type { RedeemCodeRow } from "@/app/admin/redeem/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "cn";

const BADGE_OPTIONS = [
  { value: "", label: "No badge" },
  { value: "supporter", label: "Supporter" },
  { value: "founder", label: "Founder" },
  { value: "early", label: "Early Member" },
  { value: "beta", label: "Beta Tester" },
  { value: "top-fan", label: "Top Fan" },
  { value: "binge", label: "Binge Watcher" },
  { value: "dedicated", label: "Dedicated" },
];

export function RedeemCodesManager({ codes }: { codes: RedeemCodeRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [coins, setCoins] = useState(100);
  const [maxUses, setMaxUses] = useState(1);
  const [days, setDays] = useState(0);
  const [badge, setBadge] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RedeemCodeRow | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createRedeemCode({ coins, badge: badge || null, maxUses, days });
      if (res.ok) {
        toast.success(res.message);
        setLastCode(res.code ?? null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleToggle(row: RedeemCodeRow) {
    startTransition(async () => {
      const res = await toggleRedeemCode(row.id, !row.active);
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
      router.refresh();
    });
  }

  function handleDelete() {
    const row = confirmDelete;
    if (!row) return;
    setConfirmDelete(null);
    startTransition(async () => {
      const res = await deleteRedeemCode(row.id);
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
      router.refresh();
    });
  }

  function copyCode(code: string) {
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success(`Copied ${code}`))
      .catch(() => toast.error("Could not copy."));
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleCreate}
        className="grid gap-3 rounded-xl border border-border/60 bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="rc-coins">Coins (0–100000)</Label>
          <Input
            id="rc-coins"
            type="number"
            min={0}
            max={100000}
            value={coins}
            onChange={(e) => setCoins(Math.max(0, Math.min(100000, Number(e.target.value) || 0)))}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rc-uses">Max uses</Label>
          <Input
            id="rc-uses"
            type="number"
            min={1}
            max={10000}
            value={maxUses}
            onChange={(e) => setMaxUses(Math.max(1, Math.min(10000, Number(e.target.value) || 1)))}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rc-days">Expires in</Label>
          <select
            id="rc-days"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            <option value={0}>Never</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rc-badge">Bonus badge</Label>
          <select
            id="rc-badge"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            {BADGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? <Loader2Icon className="size-4 animate-spin" /> : <PlusIcon className="size-4" />}
            Generate code
          </Button>
        </div>
      </form>

      {lastCode ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm">
          <span className="font-mono text-base font-bold tracking-widest">{lastCode}</span>
          <Button size="sm" variant="outline" onClick={() => copyCode(lastCode)}>
            <CopyIcon className="size-3.5" /> Copy
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Coins</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No codes yet — generate one above.
                </TableCell>
              </TableRow>
            ) : (
              codes.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => copyCode(row.code)}
                      className="font-mono text-xs hover:text-sky-400"
                      title="Click to copy"
                    >
                      {row.code}
                    </button>
                  </TableCell>
                  <TableCell>{row.coins > 0 ? `+${row.coins}` : "—"}</TableCell>
                  <TableCell>{row.badge ? <Badge variant="outline" className="text-[10px]">{row.badge}</Badge> : "—"}</TableCell>
                  <TableCell>
                    {row.uses}/{row.max_uses}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.expires_at
                      ? new Date(row.expires_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        row.active ? "text-emerald-400" : "text-muted-foreground",
                      )}
                    >
                      {row.active ? "Active" : "Off"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={row.active ? "Deactivate code" : "Activate code"}
                        disabled={isPending}
                        onClick={() => handleToggle(row)}
                      >
                        <PowerIcon className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Delete code"
                        disabled={isPending}
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(row)}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={confirmDelete !== null} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete code {confirmDelete?.code}?</DialogTitle>
            <DialogDescription>
              The code and all of its claim history are removed permanently. This is
              recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
