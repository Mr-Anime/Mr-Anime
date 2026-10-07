"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon, MessageSquareIcon, SendIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteComment, postComment } from "@/app/actions/comments";
import { UserBadges } from "@/components/user-badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CommentView, CommentViewer } from "@/lib/comments-shared";
import { timeAgo } from "@/lib/comments-shared";

type Props = {
  anilistId: number;
  episode: number | null;
  comments: CommentView[];
  viewer: CommentViewer | null;
  title: string;
};

export function CommentSection({ anilistId, episode, comments, viewer, title }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPosting, startPost] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const trimmed = content.trim();

  function submit() {
    if (!trimmed) return;
    startPost(async () => {
      const res = await postComment(anilistId, episode, trimmed);
      if (res.ok) {
        setContent("");
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function remove(id: string) {
    setDeletingId(id);
    startPost(async () => {
      const res = await deleteComment(id);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setDeletingId(null);
    });
  }

  return (
    <section aria-label="Comments" className="space-y-5">
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <MessageSquareIcon className="size-4 text-sky-500" />
        Comments
        <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
      </h2>

      {viewer ? (
        <div className="flex gap-3">
          <Avatar size="sm" className="mt-0.5">
            {viewer.avatar_url ? <AvatarImage src={viewer.avatar_url} alt="" /> : null}
            <AvatarFallback>{viewer.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                episode === null
                  ? `Share your thoughts on ${title}…`
                  : `Comment on episode ${episode}…`
              }
              rows={3}
              maxLength={1000}
              aria-label="Write a comment"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {trimmed.length > 0 ? `${trimmed.length}/1000` : "Ctrl+Enter to post"}
              </p>
              <Button
                size="sm"
                disabled={isPosting || trimmed.length === 0}
                onClick={submit}
              >
                {isPosting ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
                Post
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Sign in to like, comment and join the discussion.
          </p>
          <Button size="sm" render={<Link href="/login" />} variant="secondary">
            Sign in
          </Button>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          No comments yet — start the discussion.
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => {
            const author = comment.author;
            const canDelete = viewer !== null && (viewer.id === comment.user_id || viewer.role === "admin");
            return (
              <li key={comment.id} className="flex gap-3">
                <Avatar size="sm" className="mt-0.5">
                  {author?.avatar_url ? <AvatarImage src={author.avatar_url} alt="" /> : null}
                  <AvatarFallback>
                    {(author?.username ?? "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">
                      {author?.username ?? "deleted user"}
                    </span>
                    <UserBadges
                      role={author?.role}
                      isVerified={author?.is_verified}
                      badges={author?.badges}
                    />
                    <time
                      className="text-xs text-muted-foreground"
                      suppressHydrationWarning
                      dateTime={comment.created_at}
                    >
                      {timeAgo(comment.created_at)}
                    </time>
                    {canDelete ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="ml-auto size-7 text-muted-foreground hover:text-destructive"
                        aria-label="Delete comment"
                        disabled={deletingId === comment.id}
                        onClick={() => remove(comment.id)}
                      >
                        {deletingId === comment.id ? (
                          <Loader2Icon className="animate-spin" />
                        ) : (
                          <Trash2Icon />
                        )}
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
                    {comment.content}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
