import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarIcon, MessageSquareIcon } from "lucide-react";
import { getMediaByIds } from "@/lib/anilist/anime";
import { timeAgo } from "@/lib/comments-shared";
import { mediaTitle } from "@/lib/anime-format";
import { siteConfig } from "@/lib/config";
import { getProfileByUsername, getRecentComments } from "@/lib/profiles";
import { getLoadout } from "@/lib/loadouts";
import { cosmeticClass, nameClasses } from "@/lib/cosmetics";
import { isNitroActive } from "@/lib/nitro";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserBadges } from "@/components/user-badges";
import { cn } from "cn";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

type Params = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const name = username.toLowerCase();
  const profile = USERNAME_RE.test(name)
    ? await getProfileByUsername(name)
    : null;
  if (!profile) return { title: "Profile not found" };
  return {
    title: `${profile.username} — Profile`,
    description: `Public profile of ${profile.username} on ${siteConfig.name}.`,
  };
}

export default async function ProfilePage({ params }: Params) {
  const { username } = await params;
  const name = username.toLowerCase();
  const profile = USERNAME_RE.test(name) ? await getProfileByUsername(name) : null;
  if (!profile) notFound();

  const comments = await getRecentComments(profile.id);
  const cosmetics = await getLoadout(profile.id);
  const nitro = isNitroActive(profile);

  let media: Awaited<ReturnType<typeof getMediaByIds>> = [];
  if (comments.length > 0) {
    try {
      media = await getMediaByIds([...new Set(comments.map((c) => c.anilist_id))]);
    } catch (error) {
      console.error("profile: media lookup failed", error);
    }
  }
  const byId = new Map(media.map((m) => [m.id, m]));

  const joined = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <header
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-card p-5",
          nitro && "nitro-flame border-transparent",
        )}
      >
        <span
          className={cn(
            "inline-flex rounded-full",
            cosmeticClass(cosmetics?.frame),
            nitro && "nitro-avatar-glow",
          )}
        >
          <Avatar size="lg">
            {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
            <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={cn("truncate text-xl font-bold tracking-tight", nameClasses(cosmetics))}>
              {profile.username}
            </h1>
            <UserBadges
              role={profile.role}
              isVerified={profile.is_verified}
              badges={profile.badges}
              nitro={nitro}
            />
          </div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarIcon className="size-3.5" />
            Joined {joined}
          </p>
        </div>
      </header>

      <section aria-label="Recent comments" className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <MessageSquareIcon className="size-4 text-sky-500" />
          Recent comments
          <span className="text-sm font-normal text-muted-foreground">
            ({comments.length})
          </span>
        </h2>

        {comments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            No comments yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => {
              const m = byId.get(comment.anilist_id) ?? null;
              const href =
                comment.episode === null
                  ? `/anime/${comment.anilist_id}`
                  : `/watch/${comment.anilist_id}/${comment.episode}`;
              const where = [
                m ? mediaTitle(m) : `Anime #${comment.anilist_id}`,
                comment.episode !== null ? `Ep ${comment.episode}` : null,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <li
                  key={comment.id}
                  className="space-y-1 rounded-xl border border-border/60 bg-card p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <Link
                      href={href}
                      className="text-sm font-medium text-sky-400 hover:underline"
                    >
                      {where}
                    </Link>
                    <time
                      className="text-xs text-muted-foreground"
                      suppressHydrationWarning
                      dateTime={comment.created_at}
                    >
                      {timeAgo(comment.created_at)}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {comment.content}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
