"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setModVerified, type ModeratorActionResult } from "@/app/actions/moderator";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOD_VERIFIED_BADGE, MOD_VERIFIED_IMAGE } from "@/lib/badges";

export type ModeratorUser = {
  id: string;
  username: string;
  role: string;
  is_verified: boolean;
  is_banned: boolean;
  badges: string[];
  created_at: string;
};

type Props = {
  users: ModeratorUser[];
  selfId: string;
  query: string;
};

export function ModeratorPanel({ users, selfId, query }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogUser, setDialogUser] = useState<ModeratorUser | null>(null);

  function confirmVerify() {
    if (!dialogUser) return;
    const user = dialogUser;
    const has = user.badges?.includes(MOD_VERIFIED_BADGE) ?? false;
    startTransition(async () => {
      const res: ModeratorActionResult = await setModVerified(user.id, !has);
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
      setDialogUser(null);
      router.refresh();
    });
  }

  return (
    <>
      <form method="get" action="/moderator" className="flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search username…"
          className="h-9 w-56"
          aria-label="Search username"
        />
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
              <TableHead className="w-32 text-right">Moderator verified</TableHead>
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
                const hasMod = user.badges?.includes(MOD_VERIFIED_BADGE) ?? false;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.username}</span>
                        {isSelf ? <Badge variant="secondary">you</Badge> : null}
                        {hasMod ? (
                          <Image
                            src={MOD_VERIFIED_IMAGE}
                            alt="Moderator verified"
                            width={14}
                            height={14}
                            className="size-3.5"
                          />
                        ) : null}
                      </div>
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
                      <Button
                        size="sm"
                        variant={hasMod ? "outline" : "default"}
                        disabled={isSelf || isPending}
                        title={isSelf ? "You cannot verify your own account." : undefined}
                        onClick={() => setDialogUser(user)}
                      >
                        {hasMod ? "Remove" : "Verify"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={dialogUser !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setDialogUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogUser && (dialogUser.badges?.includes(MOD_VERIFIED_BADGE) ?? false)
                ? `Remove moderator verification from ${dialogUser.username}`
                : dialogUser
                  ? `Verify ${dialogUser.username}`
                  : "Moderator verification"}
            </DialogTitle>
            <DialogDescription>
              The Moderator Verified badge appears next to their name on profiles and
              comments. It is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={isPending} onClick={() => setDialogUser(null)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={confirmVerify}>
              {isPending ? "Working…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
