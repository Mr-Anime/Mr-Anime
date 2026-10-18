import {
  CheckIcon,
  FilmIcon,
  FlameIcon,
  HeartHandshakeIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
} from "lucide-react";
import {
  ACHIEVEMENTS,
  earnedAchievements,
  type ProfileStats,
} from "@/lib/achievements";
import { cn } from "cn";

const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  "first-comment": MessageSquareIcon,
  chatterbox: MessageSquareIcon,
  "binge-starter": FilmIcon,
  "binge-master": FilmIcon,
  supporter: HeartHandshakeIcon,
  "streak-7": FlameIcon,
  collector: CheckIcon,
};

/** Public stat chips: comments · episodes · forum posts · hours watched. */
export function ProfileStatsRow({ stats }: { stats: ProfileStats }) {
  const hours = Math.round((stats.episodes * 24) / 60);
  const chips = [
    { icon: MessageSquareIcon, label: `${stats.comments.toLocaleString()} comments` },
    { icon: FilmIcon, label: `${stats.episodes.toLocaleString()} episodes` },
    { icon: MessagesSquareIcon, label: `${stats.forumPosts.toLocaleString()} forum posts` },
    ...(hours > 0
      ? [{ icon: FlameIcon, label: `≈ ${hours.toLocaleString()}h watch time` }]
      : []),
  ];

  return (
    <div className="flex flex-wrap gap-2" aria-label="Profile stats">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs text-muted-foreground"
        >
          <chip.icon className="size-3.5 text-sky-400" />
          {chip.label}
        </span>
      ))}
    </div>
  );
}

/** Earned (gold) vs locked (muted) achievement grid. */
export function AchievementsGrid({ stats }: { stats: ProfileStats }) {
  const earned = earnedAchievements(stats);
  return (
    <section aria-label="Achievements" className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
        <CheckIcon className="size-5 text-amber-400" />
        Achievements
        <span className="text-sm font-normal text-muted-foreground">
          {earned.size}/{ACHIEVEMENTS.length}
        </span>
      </h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((achievement) => {
          const has = earned.has(achievement.key);
          const Icon = ACHIEVEMENT_ICONS[achievement.key] ?? CheckIcon;
          return (
            <li
              key={achievement.key}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                has
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-border/40 bg-card opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  has ? "bg-amber-500/15 text-amber-400" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {achievement.title}
                  {!has ? <span className="ml-1 text-xs text-muted-foreground">(locked)</span> : null}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {achievement.description}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
