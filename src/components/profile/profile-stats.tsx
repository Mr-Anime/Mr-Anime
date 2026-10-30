import {
  CheckIcon,
  FilmIcon,
  FlameIcon,
  HeartHandshakeIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  Trophy,
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
    {
      icon: MessageSquareIcon,
      value: stats.comments.toLocaleString(),
      label: "Comments",
      color: "from-sky-500 to-blue-600",
    },
    {
      icon: FilmIcon,
      value: stats.episodes.toLocaleString(),
      label: "Episodes Watched",
      color: "from-[#7CE5D0] to-emerald-500",
    },
    {
      icon: MessagesSquareIcon,
      value: stats.forumPosts.toLocaleString(),
      label: "Forum Posts",
      color: "from-purple-500 to-indigo-600",
    },
    {
      icon: FlameIcon,
      value: `${hours.toLocaleString()} hrs`,
      label: "Watch Time",
      color: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Profile stats">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1f1e32]/80 backdrop-blur-md p-4 shadow-lg ring-1 ring-white/5 transition-all hover:scale-[1.02]"
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${chip.color} text-white shadow-md`}>
            <chip.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-lg font-extrabold text-white leading-none">
              {chip.value}
            </span>
            <span className="mt-1 block text-xs font-semibold text-slate-400 truncate">
              {chip.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Earned (gold) vs locked (muted) achievement grid. */
export function AchievementsGrid({ stats }: { stats: ProfileStats }) {
  const earned = earnedAchievements(stats);
  return (
    <section aria-label="Achievements" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
          <Trophy className="h-5 w-5 text-amber-400" />
          Achievements
        </h2>
        <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300">
          {earned.size} / {ACHIEVEMENTS.length} Earned
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACHIEVEMENTS.map((achievement) => {
          const has = earned.has(achievement.key);
          const Icon = ACHIEVEMENT_ICONS[achievement.key] ?? CheckIcon;
          return (
            <li
              key={achievement.key}
              className={cn(
                "flex items-center gap-3.5 rounded-2xl border p-3.5 transition-all",
                has
                  ? "border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-amber-500/5 shadow-md shadow-amber-500/10"
                  : "border-white/10 bg-[#1f1e32]/50 opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-md",
                  has
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-[#161527]"
                    : "bg-white/10 text-slate-400",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-white">
                  {achievement.title}
                  {!has ? <span className="ml-1.5 text-xs text-slate-400 font-normal">(Locked)</span> : null}
                </span>
                <span className="block text-xs text-slate-300 line-clamp-1">
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
