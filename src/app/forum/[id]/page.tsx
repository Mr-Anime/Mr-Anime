import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LockIcon, MessagesSquareIcon } from "lucide-react";
import { ForumAuthorLine } from "@/components/forum/forum-author-line";
import { ForumItemActions } from "@/components/forum/forum-item-actions";
import { ForumReplyForm } from "@/components/forum/forum-reply-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getForumViewer, getThread } from "@/lib/forum";
import { cn } from "cn";

export const metadata: Metadata = { title: "Thread · Forum" };
export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const { thread, posts, totalPosts, totalPostPages } = await getThread(id, page);
  if (!thread) notFound();

  const viewer = await getForumViewer();
  const canMod = viewer !== null && (viewer.role === "admin" || viewer.role === "moderator");
  const canDeleteThread = viewer !== null && (viewer.id === thread.user_id || canMod);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <Link
        href="/forum"
        className="text-sm text-muted-foreground hover:text-sky-400 hover:underline"
      >
        ← Back to forum
      </Link>

      <article className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="flex min-w-0 items-center gap-2 text-2xl font-bold leading-tight">
            <span className="min-w-0 break-words">{thread.title}</span>
            {thread.locked ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                <LockIcon className="size-3" />
                Locked
              </span>
            ) : null}
          </h1>
          <ForumItemActions
            threadId={thread.id}
            locked={thread.locked}
            canDelete={canDeleteThread}
            canLock={canMod}
            className="shrink-0"
          />
        </div>
        <ForumAuthorLine author={thread.author} createdAt={thread.created_at} />
        <Card>
          <CardContent className="whitespace-pre-wrap break-words px-4 py-4 text-sm leading-relaxed">
            {thread.body}
          </CardContent>
        </Card>
      </article>

      <section aria-label="Replies" className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MessagesSquareIcon className="size-5 text-sky-500" />
          {totalPosts} {totalPosts === 1 ? "reply" : "replies"}
        </h2>

        {posts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            No replies yet — start the discussion.
          </p>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => {
              const canDelete =
                viewer !== null && (viewer.id === post.user_id || canMod);
              return (
                <li key={post.id}>
                  <Card className="py-4">
                    <CardContent className="space-y-2 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <ForumAuthorLine
                          author={post.author}
                          createdAt={post.created_at}
                        />
                        <ForumItemActions
                          threadId={thread.id}
                          postId={post.id}
                          canDelete={canDelete}
                          className="shrink-0"
                        />
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {post.body}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        {totalPostPages > 1 ? (
          <nav
            aria-label="Reply pages"
            className="flex items-center justify-between text-sm"
          >
            {page > 1 ? (
              <Link
                href={`/forum/${thread.id}${page > 2 ? `?page=${page - 1}` : ""}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-tap-highlight")}
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground">
              Page {page} of {totalPostPages}
            </span>
            {page < totalPostPages ? (
              <Link
                href={`/forum/${thread.id}?page=${page + 1}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-tap-highlight")}
              >
                Next
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </section>

      <section aria-label="Reply" className="space-y-2">
        <h2 className="text-lg font-semibold">Leave a reply</h2>
        {viewer === null ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            <Link
              href={`/login?next=${encodeURIComponent(`/forum/${thread.id}`)}`}
              className="text-sky-400 hover:underline"
            >
              Sign in
            </Link>{" "}
            to reply.
          </p>
        ) : thread.locked ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            This thread is locked.
          </p>
        ) : (
          <ForumReplyForm threadId={thread.id} />
        )}
      </section>
    </div>
  );
}
