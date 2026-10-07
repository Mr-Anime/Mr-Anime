"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MoreHorizontalIcon, ShieldCheckIcon, Trash2Icon, UserXIcon } from "lucide-react";
import { toast } from "sonner";
import {
  deleteAccount,
  setUserBan,
  setUserRole,
  setUserVerified,
  type AdminActionResult,
} from "@/app/actions/admin";
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
  created_at: string;
};

type DialogState = {
  kind: "ban" | "unban" | "role" | "verify" | "unverify" | "delete";
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

  function run(action: () => Promise<AdminActionResult>) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
      setDialog(null);
      setReason("");
      router.refresh();
    });
  }

  function confirmDialog() {
    if (!dialog) return;
    const { kind, user } = dialog;
    if (kind === "ban") {
      run(() => setUserBan(user.id, true, reason));
    } else if (kind === "unban") {
      run(() => setUserBan(user.id, false));
    } else if (kind === "role") {
      run(() => setUserRole(user.id, user.role === "admin" ? "user" : "admin"));
    } else if (kind === "verify") {
      run(() => setUserVerified(user.id, true));
    } else if (kind === "unverify") {
      run(() => setUserVerified(user.id, false));
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
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.username}</span>
                        {isSelf ? (
                          <Badge variant="secondary">you</Badge>
                        ) : null}
                        {user.is_verified ? (
                          <ShieldCheckIcon className="size-4 text-sky-500" aria-label="Verified" />
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
                          <DropdownMenuLabel className="truncate">
                            {user.username}
                          </DropdownMenuLabel>
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
                            onClick={() =>
                              setDialog({ kind: user.is_verified ? "unverify" : "verify", user })
                            }
                          >
                            {user.is_verified ? "Remove verification" : "Verify user"}
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
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === "delete"
                ? "Delete account"
                : dialog?.kind === "ban"
                  ? `Ban ${dialog.user.username}`
                  : dialog?.kind === "unban"
                    ? `Unban ${dialog.user.username}`
                    : dialog?.kind === "role"
                      ? dialog.user.role === "admin"
                        ? "Demote admin"
                        : "Promote to admin"
                      : dialog?.kind === "verify"
                        ? "Verify user"
                        : "Remove verification"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === "delete" ? (
                <>
                  This permanently deletes{" "}
                  <span className="font-medium text-foreground">{dialog.user.username}</span> and
                  everything tied to the account. This cannot be undone.
                </>
              ) : dialog?.kind === "ban" ? (
                "Banned users are redirected to a suspension page on every request."
              ) : dialog?.kind === "role" ? (
                dialog.user.role === "admin"
                  ? "They will lose access to the admin panel immediately."
                  : "They will gain full access to the admin panel."
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

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(null); setReason(""); }}>
              Cancel
            </Button>
            <Button
              variant={dialog?.kind === "delete" ? "destructive" : "default"}
              disabled={isPending}
              onClick={confirmDialog}
            >
              {isPending ? "Working…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
