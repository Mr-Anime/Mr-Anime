"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon, LockIcon, LockOpenIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deletePost, deleteThread, setThreadLocked } from "@/app/actions/forum";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PendingAction = () => Promise<void>;

/** Delete / lock-unlock controls for a thread or reply (owner or mod/admin). */
export function ForumItemActions({
  threadId,
  postId,
  locked,
  canDelete,
  canLock,
  className,
}: {
  threadId: string;
  postId?: string;
  locked?: boolean;
  canDelete: boolean;
  canLock?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    action: PendingAction;
  } | null>(null);

  function run(action: PendingAction) {
    startTransition(async () => {
      await action();
      setConfirm(null);
    });
  }

  if (!canDelete && !canLock) return null;

  return (
    <span className={className}>
      <span className="flex items-center gap-1">
        {canLock && postId === undefined ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            disabled={isPending}
            onClick={() =>
              setConfirm({
                title: locked ? "Unlock thread?" : "Lock thread?",
                description: locked
                  ? "Members will be able to reply again."
                  : "New replies will be blocked until it is unlocked.",
                action: async () => {
                  const res = await setThreadLocked(threadId, !locked);
                  if (res.ok) {
                    toast.success(res.message);
                    router.refresh();
                  } else {
                    toast.error(res.error);
                  }
                },
              })
            }
          >
            {isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : locked ? (
              <LockOpenIcon />
            ) : (
              <LockIcon />
            )}
            {locked ? "Unlock" : "Lock"}
          </Button>
        ) : null}
        {canDelete ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 text-muted-foreground hover:text-destructive"
            aria-label={postId ? "Delete reply" : "Delete thread"}
            disabled={isPending}
            onClick={() =>
              setConfirm({
                title: postId ? "Delete reply?" : "Delete thread?",
                description: postId
                  ? "This reply will be removed permanently."
                  : "The thread and all of its replies will be removed permanently.",
                action: async () => {
                  const res = postId
                    ? await deletePost(postId)
                    : await deleteThread(threadId);
                  if (res.ok) {
                    toast.success(res.message);
                    if (!postId) {
                      router.push("/forum");
                    }
                    router.refresh();
                  } else {
                    toast.error(res.error);
                  }
                },
              })
            }
          >
            <Trash2Icon />
          </Button>
        ) : null}
      </span>

      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setConfirm(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{confirm?.title}</DialogTitle>
            <DialogDescription>{confirm?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                if (confirm) run(confirm.action);
              }}
            >
              {isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <Trash2Icon />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </span>
  );
}
