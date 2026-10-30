import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarIcon,
  BookmarkIcon,
  MessageSquareIcon,
  Tv,
  Flame,
  Sparkles,
} from "lucide-react";
import { getMediaByIds } from "@/lib/anilist/anime";
import { timeAgo } from "@/lib/comments-shared";
import { mediaTitle } from "@/lib/anime-format";
import { siteConfig } from "@/lib/config";
import { getProfileByUsername, getRecentComments } from "@/lib/profiles";
import { getLoadout } from "@/lib/loadouts";
import { nameClasses, userFrameClass } from "@/lib/cosmetics";
import { isNitroActive } from "@/lib/nitro";
import { getCommentActivity } from "@/lib/activity";
import { getProfileStats } from "@/lib/achievements";
import { ActivityHistory } from "@/components/profile/activity-history";
import { AchievementsGrid, ProfileStatsRow } from "@/components/profile/profile-stats";
import { SpoilerText } from "@/components/comments/spoiler-text";
import { NebulaCore } from "@/components/avatar/nebula-core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MEMBER_NEBULA_BADGE } from "@/lib/badges";
import { getProfilePrefs } from "@/lib/prefs-server";
import {
  BADGE_HIDE_ALL,
  FLAIR,
  PROFILE_THEMES,
  TITLES,
  bannerCss,
} from "@/lib/profile-prefs";
import { AVATAR_SRC } from "@/lib/avatar-catalog";
import { UserBadges } from "@/components/user-badges";
import { cn } from "cn";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

type Params = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ range?: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const name = username.toLowerCase();
  const profile = USERNAME_RE.test(name)
    ? await getProfileByUsername(name)
    : null;
  if (!profile) return { title: "Profile not found" };
  return {
    title: `${profile.username} — Profile`,
    description: `Public anime profile of ${profile.username} on ${siteConfig.name}.`,
  };
}

export default async function ProfilePage({ params, searchParams }: Params) {
  const { username } = await params;
  const sp = await searchParams;
  const range = sp.range === "year" ? "1y" : "6m";
  const name = username.toLowerCase();
  const profile = USERNAME_RE.test(name) ? await getProfileByUsername(name) : null;
  if (!profile) notFound();

  const comments = await getRecentComments(profile.id);
  const cosmetics = await getLoadout(profile.id);
  const activity = await getCommentActivity(profile.id, range === "1y" ? 365 : 182);
  const stats = await getProfileStats(profile.id);
  const nitro = isNitroActive(profile);
  const showNebula = profile.badges?.includes(MEMBER_NEBULA_BADGE) ?? false;

  const prefs = await getProfilePrefs(profile.id);
  const themeDef = PROFILE_THEMES[prefs.theme] ?? PROFILE_THEMES.classic;
  const titleDef = prefs.title ? TITLES.find((t) => t.key === prefs.title) ?? null : null;
  const favorites = prefs.characters.filter((c) => c in AVATAR_SRC);
  const visibleBadges =
    prefs.displayBadges.length === 0
      ? profile.badges
      : prefs.displayBadges.includes(BADGE_HIDE_ALL)
        ? []
        : profile.badges.filter((b) => prefs.displayBadges.includes(b));
  const themeStyle =
    prefs.theme === "classic"
      ? undefined
      : { borderColor: `${themeDef.accent}88`, boxShadow: themeDef.glow };

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
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8">
      {/* Profile Header Banner */}
      <header
        style={themeStyle}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-white/10 bg-[#161527] shadow-2xl ring-1 ring-white/5",
          nitro && "nitro-flame border-transparent",
        )}
      >
        {/* Banner Graphic */}
        <div
          className="h-32 w-full transition-opacity duration-300"
          style={{ background: bannerCss(prefs.bannerId) }}
        />

        {/* User Info Overlay */}
        <div className="relative px-6 pb-6 pt-0">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-5">
              <span
                className={cn(
                  "inline-flex rounded-2xl ring-4 ring-[#161527] shadow-2xl",
                  userFrameClass(profile.username, cosmetics),
                  nitro && "nitro-avatar-glow",
                )}
              >
                {showNebula ? (
                  <NebulaCore
                    src={profile.avatar_url}
                    username={profile.username}
                    size={72}
                  />
                ) : (
                  <Avatar size="lg" className="h-20 w-20 rounded-2xl">
                    {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                    <AvatarFallback className="rounded-2xl bg-gradient-to-br from-[#7CE5D0] to-[#55C7F0] text-2xl font-black text-[#161527]">
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </span>

              <div className="min-w-0 space-y-1.5 pt-2 sm:pt-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1
                    className={cn(
                      "truncate text-2xl font-black tracking-wide text-white sm:text-3xl",
                      nameClasses(cosmetics),
                    )}
                  >
                    {profile.username}
                  </h1>
                  <UserBadges
                    role={profile.role}
                    isVerified={profile.is_verified}
                    badges={visibleBadges}
                    nitro={nitro}
                  />
                </div>

                {titleDef ? (
                  <p className={cn("text-xs font-extrabold uppercase tracking-widest", themeDef.text)}>
                    「{titleDef.label}」
                  </p>
                ) : null}

                {prefs.flair.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {prefs.flair.map((key) => {
                      const f = FLAIR.find((x) => x.key === key);
                      if (!f) return null;
                      return (
                        <span
                          key={key}
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px] font-black uppercase ring-1 ring-inset shadow-sm",
                            f.cls,
                          )}
                        >
                          {f.label}
                        </span>
                      );
                    })}
                  </div>
                ) : null}

                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <CalendarIcon className="h-3.5 w-3.5 text-[#7CE5D0]" />
                  Joined {joined}
                </p>
              </div>
            </div>

            <Link
              href="/customize"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#7CE5D0]" />
              <span>Customize Profile</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Favorite Characters */}
      {favorites.length > 0 ? (
        <section
          aria-label="Favorite characters"
          className="rounded-3xl border border-white/10 bg-[#161527] p-6 shadow-xl"
        >
          <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold text-white">
            <BookmarkIcon className="h-4 w-4 text-[#7CE5D0]" />
            Favorite Characters
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {favorites.map((id) => (
              <figure
                key={id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#1f1e32] text-center shadow-md transition-all hover:scale-105 hover:border-[#7CE5D0]/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- catalog avatar */}
                <img
                  src={AVATAR_SRC[id]}
                  alt={id.split("/")[1]?.replace(/\.[a-z0-9]+$/i, "") ?? "Character"}
                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <figcaption className="truncate px-2 py-1.5 text-[11px] font-bold text-slate-300">
                  {id.split("/")[0].replace(/_/g, " ")}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* Stats Summary Cards */}
      <ProfileStatsRow stats={stats} />

      {/* Activity History Heatmap */}
      <ActivityHistory data={activity} range={range} />

      {/* Recent Comments Feed */}
      <section aria-label="Recent comments" className="space-y-4">
        <h2 className="flex items-center justify-between text-xl font-extrabold text-white">
          <span className="flex items-center gap-2">
            <MessageSquareIcon className="h-5 w-5 text-[#55C7F0]" />
            Recent Comments
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
            {comments.length}
          </span>
        </h2>

        {comments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm font-semibold text-slate-400">
            No comments posted yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => {
              const m = byId.get(comment.anilist_id) ?? null;
              const href =
                comment.episode === null
                  ? `/anime/${comment.anilist_id}`
                  : `/watch/${comment.anilist_id}/${comment.episode}`;
              const titleText = m ? mediaTitle(m) : `Anime #${comment.anilist_id}`;

              return (
                <li
                  key={comment.id}
                  className="group space-y-2 rounded-2xl border border-white/10 bg-[#161527] p-5 shadow-lg transition-all hover:border-[#7CE5D0]/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={href}
                      className="inline-flex items-center gap-2 font-bold text-[#7CE5D0] hover:underline"
                    >
                      <Tv className="h-4 w-4 text-[#55C7F0]" />
                      <span>{titleText}</span>
                      {comment.episode !== null ? (
                        <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">
                          EP {comment.episode}
                        </span>
                      ) : null}
                    </Link>
                    <time
                      className="text-xs font-medium text-slate-400"
                      suppressHydrationWarning
                      dateTime={comment.created_at}
                    >
                      {timeAgo(comment.created_at)}
                    </time>
                  </div>
                  <SpoilerText
                    text={comment.content}
                    className="text-sm text-slate-300 leading-relaxed"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Achievements */}
      <AchievementsGrid stats={stats} />
    </div>
  );
}
