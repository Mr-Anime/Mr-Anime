"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon, MessageSquareIcon, SendIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteComment, postComment } from "@/app/actions/comments";
import { ProfileHoverCard } from "@/components/profile-hover-card";
import { UserBadges } from "@/components/user-badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CommentView, CommentViewer } from "@/lib/comments-shared";
import { timeAgo } from "@/lib/comments-shared";
import { cosmeticClass, nameClasses } from "@/lib/cosmetics";
import { cn } from "cn";

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
          <Link
            href={`/profile/${viewer.username}`}
            className="mt-0.5 shrink-0"
            aria-label="View your profile"
          >
            <Avatar size="sm">
              {viewer.avatar_url ? <AvatarImage src={viewer.avatar_url} alt="" /> : null}
              <AvatarFallback>{viewer.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
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
                {author?.username ? (
                  <Link
                    href={`/profile/${author.username}`}
                    className="mt-0.5 shrink-0"
                    aria-label={`View ${author.username}'s profile`}
                  >
                    <span
                      className={cn(
                        "inline-flex rounded-full",
                        cosmeticClass(author.cosmetics?.frame),
                      )}
                    >
                      <Avatar size="sm">
                        {author.avatar_url ? (
                          <AvatarImage src={author.avatar_url} alt="" />
                        ) : null}
                        <AvatarFallback>
                          {author.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </span>
                  </Link>
                ) : (
                  <Avatar size="sm" className="mt-0.5">
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {author?.username ? (
                      <ProfileHoverCard username={author.username}>
                        <Link
                          href={`/profile/${author.username}`}
                          className={cn(
                            "text-sm font-medium hover:text-sky-400 hover:underline",
                            nameClasses(author.cosmetics),
                          )}
                        >
                          {author.username}
                        </Link>
                      </ProfileHoverCard>
                    ) : (
                      <span className="text-sm font-medium">deleted user</span>
                    )}
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
