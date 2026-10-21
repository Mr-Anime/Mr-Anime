"use client";

import Link from "next/link";
import { ProfileHoverCard } from "@/components/profile-hover-card";
import { UserBadges } from "@/components/user-badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ForumAuthor } from "@/lib/forum";
import { timeAgo } from "@/lib/comments-shared";
import { nameClasses, userFrameClass } from "@/lib/cosmetics";
import { isNitroActive } from "@/lib/nitro";
import { cn } from "cn";

/** Avatar + username + badges + relative time — mirrors comment authors. */
export function ForumAuthorLine({
  author,
  createdAt,
}: {
  author: ForumAuthor | null;
  createdAt: string;
}) {
  const nitro = isNitroActive(author);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {author?.username ? (
        <>
          <ProfileHoverCard username={author.username}>
            <Link
              href={`/profile/${author.username}`}
              className="shrink-0"
              aria-label={`View ${author.username}'s profile`}
            >
              <span
                className={cn(
                  "inline-flex rounded-full",
                  userFrameClass(author.username, author.cosmetics),
                  nitro && "nitro-avatar-glow",
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
          </ProfileHoverCard>
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
          <UserBadges
            role={author.role}
            isVerified={author.is_verified}
            badges={author.badges}
            nitro={nitro}
          />
        </>
      ) : (
        <span className="text-sm font-medium text-muted-foreground">
          deleted user
        </span>
      )}
      <time
        className="text-xs text-muted-foreground"
        suppressHydrationWarning
        dateTime={createdAt}
      >
        {timeAgo(createdAt)}
      </time>
    </div>
  );
}
