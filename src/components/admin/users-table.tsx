"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AwardIcon, MoreHorizontalIcon, FlameIcon, HeartHandshakeIcon, ShieldCheckIcon, SparklesIcon, Trash2Icon, UserXIcon } from "lucide-react";
import { toast } from "sonner";
import {
  deleteAccount,
  setUserBadge,
  setUserBan,
  setUserExclusiveFrame,
  setUserRole,
  setUserVerified,
  type AdminActionResult,
} from "@/app/actions/admin";
import {
  ADMIN_GRANTABLE_BADGES,
  BADGE_LABELS,
  DONOR_BADGE,
  MEMBER_NEBULA_BADGE,
  MEMBER_NITRO_BADGE,
  MEMBER_VERIFIED_BADGE,
  MEMBER_VERIFIED_IMAGE,
  MOD_VERIFIED_BADGE,
  MOD_VERIFIED_IMAGE,
} from "@/lib/badges";
import { EXCLUSIVE_FRAMES } from "@/lib/cosmetics";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export type AdminUser = {
  id: string;
  username: string;
  role: string;
  is_verified: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  badges: string[];
  created_at: string;
  exclusiveFrames?: string[];
};

type DialogState = {
  kind: "ban" | "unban" | "role" | "modrole" | "verify" | "unverify" | "badge" | "modbadge" | "nitro" | "nebula" | "donorbadge" | "badges" | "frames" | "delete";
  user: AdminUser;
} | null;

type Props = {
  users: AdminUser[];
  selfId: string;
  query: string;
  role: string;
  status: string;
  page: number;
  totalPages: number;
};

export function UsersTable({ users, selfId, query, role, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [reason, setReason] = useState("");
  const [badgeSel, setBadgeSel] = useState<string[]>([]);
  const [frameSel, setFrameSel] = useState<string[]>([]);

  function run(action: () => Promise<AdminActionResult>) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
      setDialog(null);
      setReason("");
      setBadgeSel([]);
      setFrameSel([]);
      router.refresh();
    });
  }

  function openBadges(user: AdminUser) {
    setBadgeSel((user.badges ?? []).filter((b) => ADMIN_GRANTABLE_BADGES.includes(b as never)));
    setDialog({ kind: "badges", user });
  }

  function applyBadges() {
    if (!dialog || dialog.kind !== "badges") return;
    const { user } = dialog;
    const orig = new Set(
      (user.badges ?? []).filter((b) => ADMIN_GRANTABLE_BADGES.includes(b as never)),
    );
    const next = new Set(badgeSel);
    const added = [...next].filter((b) => !orig.has(b));
    const removed = [...orig].filter((b) => !next.has(b));
    if (added.length === 0 && removed.length === 0) {
      setDialog(null);
      setBadgeSel([]);
      return;
    }
    startTransition(async () => {
      let changed = 0;
      let failed = false;
      for (const b of added) {
        const res = await setUserBadge(user.id, b, true);
        if (!res.ok) { toast.error(res.error); failed = true; break; }
        changed += 1;
      }
      if (!failed) {
        for (const b of removed) {
          const res = await setUserBadge(user.id, b, false);
          if (!res.ok) { toast.error(res.error); failed = true; break; }
          changed += 1;
        }
      }
      if (!failed) toast.success(`Updated ${changed} badge${changed === 1 ? "" : "s"}.`);
      setDialog(null);
      setBadgeSel([]);
      router.refresh();
    });
  }

  function openFrames(user: AdminUser) {
    setFrameSel(user.exclusiveFrames ?? []);
    setDialog({ kind: "frames", user });
  }

  function applyFrames() {
    if (!dialog || dialog.kind !== "frames") return;
    const { user } = dialog;
    const orig = new Set(user.exclusiveFrames ?? []);
    const next = new Set(frameSel);
    const added = [...next].filter((f) => !orig.has(f));
    const removed = [...orig].filter((f) => !next.has(f));
    if (added.length === 0 && removed.length === 0) {
      setDialog(null);
      setFrameSel([]);
      return;
    }
    startTransition(async () => {
      let changed = 0;
      let failed = false;
      for (const f of added) {
        const res = await setUserExclusiveFrame(user.id, f, true);
        if (!res.ok) { toast.error(res.error); failed = true; break; }
        changed += 1;
      }
      if (!failed) {
        for (const f of removed) {
          const res = await setUserExclusiveFrame(user.id, f, false);
          if (!res.ok) { toast.error(res.error); failed = true; break; }
          changed += 1;
        }
      }
      if (!failed) {
        toast.success(`Updated ${changed} exclusive frame${changed === 1 ? "" : "s"}.`);
      }
      setDialog(null);
      setFrameSel([]);
      router.refresh();
    });
  }

  function confirmDialog() {
    if (!dialog) return;
    const { kind, user } = dialog;
    if (kind === "badges") {
      applyBadges();
      return;
    }
    if (kind === "frames") {
      applyFrames();
      return;
    }
    if (kind === "ban") {
      run(() => setUserBan(user.id, true, reason));
    } else if (kind === "unban") {
      run(() => setUserBan(user.id, false));
    } else if (kind === "role") {
      run(() => setUserRole(user.id, user.role === "admin" ? "user" : "admin"));
    } else if (kind === "modrole") {
      run(() => setUserRole(user.id, user.role === "moderator" ? "user" : "moderator"));
    } else if (kind === "verify") {
      run(() => setUserVerified(user.id, true));
    } else if (kind === "unverify") {
      run(() => setUserVerified(user.id, false));
    } else if (kind === "badge") {
      const has = user.badges?.includes(MEMBER_VERIFIED_BADGE) ?? false;
      run(() => setUserBadge(user.id, MEMBER_VERIFIED_BADGE, !has));
    } else if (kind === "modbadge") {
      const has = user.badges?.includes(MOD_VERIFIED_BADGE) ?? false;
      run(() => setUserBadge(user.id, MOD_VERIFIED_BADGE, !has));
    } else if (kind === "nitro") {
      const has = user.badges?.includes(MEMBER_NITRO_BADGE) ?? false;
      run(() => setUserBadge(user.id, MEMBER_NITRO_BADGE, !has));
    } else if (kind === "nebula") {
      const has = user.badges?.includes(MEMBER_NEBULA_BADGE) ?? false;
      run(() => setUserBadge(user.id, MEMBER_NEBULA_BADGE, !has));
    } else if (kind === "donorbadge") {
      const has = user.badges?.includes(DONOR_BADGE) ?? false;
      run(() => setUserBadge(user.id, DONOR_BADGE, !has));
    } else if (kind === "delete") {
      run(() => deleteAccount(user.id));
    }
  }

  return (
    <>
      <form method="get" action="/admin/users" className="flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search username…"
          className="h-9 w-56"
          aria-label="Search username"
        />
        <select
          name="role"
          defaultValue={role}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          aria-label="Filter by status"
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
        <Button type="submit" variant="secondary" size="sm" className="h-9">
          Apply
        </Button>
      </form>

      <div className="rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isSelf = user.id === selfId;
                const hasVerifiedBadge =
                  user.badges?.includes(MEMBER_VERIFIED_BADGE) ?? false;
                const hasModBadge =
                  user.badges?.includes(MOD_VERIFIED_BADGE) ?? false;
                const hasNitroBadge = user.badges?.includes(MEMBER_NITRO_BADGE) ?? false;
                const hasNebulaBadge = user.badges?.includes(MEMBER_NEBULA_BADGE) ?? false;
                const hasDonorBadge = user.badges?.includes(DONOR_BADGE) ?? false;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.username}</span>
                        {isSelf ? (
                          <Badge variant="secondary">you</Badge>
                        ) : null}
                        {user.is_verified ? (
                          <ShieldCheckIcon
                            className="size-4 text-sky-500"
                            aria-label="Owner verified"
                          />
                        ) : null}
                        {hasVerifiedBadge ? (
                          <Image
                            src={MEMBER_VERIFIED_IMAGE}
                            alt="Verified"
                            width={14}
                            height={14}
                            className="size-3.5"
                          />
                        ) : null}
                        {hasModBadge ? (
                          <Image
                            src={MOD_VERIFIED_IMAGE}
                            alt="Moderator verified"
                            width={14}
                            height={14}
                            className="size-3.5"
                          />
                        ) : null}
                        {hasNitroBadge ? (
                          <FlameIcon
                            className="size-4 text-cyan-400"
                            aria-label="Mr. Anime Nitro"
                          />
                        ) : null}
                      </div>
                      {user.is_banned && user.ban_reason ? (
                        <p className="text-xs text-destructive">Reason: {user.ban_reason}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "outline"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge variant="destructive">banned</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-500">
                          active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground" suppressHydrationWarning>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.username}`} />
                          }
                        >
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="truncate">
                              {user.username}
                            </DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={isSelf}
                            onClick={() =>
                              setDialog({ kind: user.is_banned ? "unban" : "ban", user })
                            }
                          >
                            <UserXIcon />
                            {user.is_banned ? "Unban user" : "Ban user"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isSelf}
                            onClick={() => setDialog({ kind: "role", user })}
                          >
                            {user.role === "admin" ? "Demote to user" : "Promote to admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isSelf}
                            onClick={() => setDialog({ kind: "modrole", user })}
                          >
                            <ShieldCheckIcon className="text-sky-400" />
                            {user.role === "moderator"
                              ? "Remove moderator"
                              : "Make moderator"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isSelf}
                            onClick={() =>
                              setDialog({ kind: user.is_verified ? "unverify" : "verify", user })
                            }
                          >
                            {user.is_verified
                              ? "Remove Owner verification"
                              : "Grant Owner verification"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isSelf}
                            onClick={() => setDialog({ kind: "badge", user })}
                          >
                            <Image
                              src={MEMBER_VERIFIED_IMAGE}
                              alt=""
                              width={14}
                              height={14}
                              className="size-3.5"
                            />
                            {hasVerifiedBadge ? "Remove verified badge" : "Give verified badge"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isSelf}
                            onClick={() => setDialog({ kind: "modbadge", user })}
                          >
                            <Image
                              src={MOD_VERIFIED_IMAGE}
                              alt=""
                              width={14}
                              height={14}
                              className="size-3.5"
                            />
                            {hasModBadge
                              ? "Remove moderator verified"
                              : "Give moderator verified"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isSelf}
                            onClick={() => setDialog({ kind: "nitro", user })}
                          >
                            <FlameIcon className="text-cyan-400" />
                            {hasNitroBadge ? "Remove Nitro" : "Give Mr. Anime Nitro"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isSelf}
                            onClick={() => setDialog({ kind: "nebula", user })}
                          >
                            <SparklesIcon className="text-purple-400" />
                            {hasNebulaBadge ? "Remove Nebula avatar" : "Give Nebula avatar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isSelf}
                            onClick={() => setDialog({ kind: "donorbadge", user })}
                          >
                            <HeartHandshakeIcon className="text-rose-400" />
                            {hasDonorBadge
                              ? "Remove Supporter badge"
                              : "Give Supporter badge"}
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={isSelf} onClick={() => openBadges(user)}>
                            <AwardIcon className="text-amber-400" />
                            Manage badges…
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={isSelf} onClick={() => openFrames(user)}>
                            <SparklesIcon className="text-rose-400" />
                            Exclusive frames…
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={isSelf}
                            onClick={() => setDialog({ kind: "delete", user })}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2Icon />
                            Delete account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setReason("");
            setBadgeSel([]);
            setFrameSel([]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === "delete"
                ? "Delete account"
                : dialog?.kind === "badges"
                  ? `Manage ${dialog.user.username}'s badges`
                  : dialog?.kind === "frames"
                    ? `Manage ${dialog.user.username}'s exclusive frames`
                    : dialog?.kind === "ban"
                  ? `Ban ${dialog.user.username}`
                  : dialog?.kind === "unban"
                    ? `Unban ${dialog.user.username}`
                      : dialog?.kind === "role"
                        ? dialog.user.role === "admin"
                          ? "Demote admin"
                          : "Promote to admin"
                        : dialog?.kind === "modrole"
                          ? dialog.user.role === "moderator"
                            ? "Remove moderator"
                            : "Make moderator"
                        : dialog?.kind === "badge"
                          ? dialog.user.badges?.includes(MEMBER_VERIFIED_BADGE)
                            ? "Remove verified badge"
                            : "Grant verified badge"
                          : dialog?.kind === "modbadge"
                            ? dialog.user.badges?.includes(MOD_VERIFIED_BADGE)
                              ? "Remove moderator verified"
                              : "Grant moderator verified"
                        : dialog?.kind === "nitro"
                          ? dialog.user.badges?.includes(MEMBER_NITRO_BADGE)
                            ? "Remove Mr. Anime Nitro"
                            : "Grant Mr. Anime Nitro"
                          : dialog?.kind === "nebula"
                            ? dialog.user.badges?.includes(MEMBER_NEBULA_BADGE)
                              ? "Remove Nebula avatar"
                              : "Grant Nebula avatar"
                          : dialog?.kind === "donorbadge"
                            ? dialog.user.badges?.includes(DONOR_BADGE)
                              ? "Remove Supporter badge"
                              : "Grant Supporter badge"
                          : dialog?.kind === "verify"
                          ? "Grant Owner verification"
                          : "Remove Owner verification"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === "delete" ? (
                <>
                  This permanently deletes{" "}
                  <span className="font-medium text-foreground">{dialog.user.username}</span> and
                  everything tied to the account. This cannot be undone.
                </>
              ) : dialog?.kind === "badges" ? (
                "Tick badges to grant, untick to revoke. Only staff/milestone badges are listed — every change is recorded in the audit log."
              ) : dialog?.kind === "frames" ? (
                "Tick a frame to give it to this user — it is equipped immediately and cannot be bought in the shop. Untick to remove it. Every change is recorded in the audit log."
              ) : dialog?.kind === "ban" ? (
                "Banned users are redirected to a suspension page on every request."
              ) : dialog?.kind === "role" ? (
                dialog.user.role === "admin"
                  ? "They will lose access to the admin panel immediately."
                  : "They will gain full access to the admin panel."
              ) : dialog?.kind === "modrole" ? (
                dialog.user.role === "moderator"
                  ? "They will lose access to the moderator panel immediately."
                  : "They will gain access to the moderator panel to grant the Moderator Verified badge."
              ) : dialog?.kind === "badge" ? (
                "The verified badge appears next to their name on profiles and comments. It is recorded in the audit log."
              ) : dialog?.kind === "modbadge" ? (
                "The Moderator Verified badge appears next to their name on profiles and comments. It is recorded in the audit log."
              ) : dialog?.kind === "nitro" ? (
                "Mr. Anime Nitro gives blue flame effects on their profile and hover card, a blue avatar aura and the NITRO badge. It is recorded in the audit log."
              ) : dialog?.kind === "nebula" ? (
                "The exclusive Nebula Core animated avatar (energy ring, shards, particles and mascot sprite) shows on their profile page. It is recorded in the audit log."
              ) : dialog?.kind === "donorbadge" ? (
                "The Supporter badge (gold heart pill) appears next to their name — usually auto-granted on donations. It is recorded in the audit log."
              ) : (
                "Confirm this change. It is recorded in the audit log."
              )}
            </DialogDescription>
          </DialogHeader>

          {dialog?.kind === "ban" ? (
            <div className="grid gap-2">
              <Label htmlFor="ban-reason">Reason (shown to the user)</Label>
              <Textarea
                id="ban-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Abusive comments"
                rows={3}
                maxLength={500}
              />
            </div>
          ) : null}

          {dialog?.kind === "badges" ? (
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {ADMIN_GRANTABLE_BADGES.map((b) => (
                <label
                  key={b}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 px-2 py-1.5 text-sm transition-colors hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    checked={badgeSel.includes(b)}
                    onChange={(e) =>
                      setBadgeSel((prev) =>
                        e.target.checked ? [...prev, b] : prev.filter((x) => x !== b),
                      )
                    }
                    className="accent-sky-500"
                  />
                  {BADGE_LABELS[b] ?? b}
                </label>
              ))}
            </div>
          ) : null}

          {dialog?.kind === "frames" ? (
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {EXCLUSIVE_FRAMES.map((frame) => (
                <label
                  key={frame.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 px-2 py-1.5 text-sm transition-colors hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    checked={frameSel.includes(frame.id)}
                    onChange={(e) =>
                      setFrameSel((prev) =>
                        e.target.checked ? [...prev, frame.id] : prev.filter((x) => x !== frame.id),
                      )
                    }
                    className="accent-sky-500"
                  />
                  <Image
                    src={frame.src}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 rounded-full object-contain"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{frame.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {frame.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialog(null);
                setReason("");
                setBadgeSel([]);
                setFrameSel([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={dialog?.kind === "delete" ? "destructive" : "default"}
              disabled={isPending}
              onClick={confirmDialog}
            >
              {isPending
                ? "Working…"
                : dialog?.kind === "badges" || dialog?.kind === "frames"
                  ? "Apply"
                  : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
