import type { Metadata } from "next";
import Link from "next/link";
import { LockIcon, MessagesSquareIcon, PlusIcon } from "lucide-react";
import { ForumAuthorLine } from "@/components/forum/forum-author-line";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listThreads } from "@/lib/forum";
import { cn } from "cn";

export const metadata: Metadata = { title: "Forum" };
export const dynamic = "force-dynamic";

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { threads, total, totalPages } = await listThreads(page);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MessagesSquareIcon className="size-6 text-sky-500" />
            Forum
          </h1>
          <p className="text-sm text-muted-foreground">
            Talk anime, shows, and everything Mr.Anime.
          </p>
        </div>
        <Link
          href="/forum/new"
          className={cn(buttonVariants(), "no-tap-highlight")}
        >
          <PlusIcon />
          New thread
        </Link>
      </div>

      {threads.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
          No threads yet — be the first to start a discussion.
        </p>
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Card className="py-4 transition-colors hover:border-border">
                <CardContent className="space-y-2 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/forum/${thread.id}`}
                      className="min-w-0 text-base font-semibold leading-snug hover:text-sky-400 hover:underline"
                    >
                      {thread.title}
                    </Link>
                    {thread.locked ? (
                      <span
                        className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        title="Locked"
                      >
                        <LockIcon className="size-3" />
                        Locked
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <ForumAuthorLine
                      author={thread.author}
                      createdAt={thread.created_at}
                    />
                    <span className="flex items-center gap-1">
                      <MessagesSquareIcon className="size-3.5" />
                      {thread.replyCount}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Forum pages"
          className="flex items-center justify-between text-sm"
        >
          {page > 1 ? (
            <Link
              href={page > 2 ? `/forum?page=${page - 1}` : "/forum"}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-tap-highlight")}
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {page} of {totalPages} · {total} threads
          </span>
          {page < totalPages ? (
            <Link
              href={`/forum?page=${page + 1}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-tap-highlight")}
            >
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
