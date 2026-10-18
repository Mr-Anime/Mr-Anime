import type { Metadata } from "next";
import Link from "next/link";
import { CrownIcon, MessageSquareIcon, CoinsIcon, HeartHandshakeIcon } from "lucide-react";
import { UserBadges } from "@/components/user-badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createAdminClient } from "@/lib/supabase/admin";
import { isNitroActive } from "@/lib/nitro";
import { cn } from "cn";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

type BoardRow = {
  username: string;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  badges: string[] | null;
  nitro_until: string | null;
  value: number;
  sub?: string;
};

const TABS = [
  { id: "comments", label: "Commenters", icon: MessageSquareIcon },
  { id: "coins", label: "Richest", icon: CoinsIcon },
  { id: "donors", label: "Supporters", icon: HeartHandshakeIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

async function getBoard(tab: TabId): Promise<BoardRow[]> {
  try {
    const admin = createAdminClient();

    if (tab === "comments") {
      const { data, error } = await admin.rpc("leaderboard_comments", { p_limit: 20 });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        username: String(r.username ?? ""),
        avatar_url: (r.avatar_url as string | null) ?? null,
        role: String(r.role ?? "user"),
        is_verified: Boolean(r.is_verified),
        badges: (r.badges as string[] | null) ?? null,
        nitro_until: (r.nitro_until as string | null) ?? null,
        value: Number(r.value ?? 0),
      }));
    }

    if (tab === "coins") {
      const { data, error } = await admin
        .from("wallets")
        .select("coins, profiles(username, avatar_url, role, is_verified, badges, nitro_until)")
        .order("coins", { ascending: false })
        .limit(20);
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[])
        .map((r) => {
          const p = (r.profiles ?? {}) as Record<string, unknown>;
          return {
            username: String(p.username ?? ""),
            avatar_url: (p.avatar_url as string | null) ?? null,
            role: String(p.role ?? "user"),
            is_verified: Boolean(p.is_verified),
            badges: (p.badges as string[] | null) ?? null,
            nitro_until: (p.nitro_until as string | null) ?? null,
            value: Number(r.coins ?? 0),
          };
        })
        .filter((r) => r.username);
    }

    // donors: aggregate paid donations per user in JS (small table).
    const { data, error } = await admin
      .from("donations")
      .select("user_id, amount, profiles(username, avatar_url, role, is_verified, badges, nitro_until)")
      .eq("status", "Paid");
    if (error) throw error;
    const totals = new Map<string, { total: number; profile: Record<string, unknown> }>();
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      if (!row.user_id || !row.profiles) continue;
      const id = String(row.user_id);
      const entry = totals.get(id) ?? { total: 0, profile: row.profiles as Record<string, unknown> };
      entry.total += Number(row.amount ?? 0);
      totals.set(id, entry);
    }
    return [...totals.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 20)
      .map(([, { total, profile }]) => ({
        username: String(profile.username ?? ""),
        avatar_url: (profile.avatar_url as string | null) ?? null,
        role: String(profile.role ?? "user"),
        is_verified: Boolean(profile.is_verified),
        badges: (profile.badges as string[] | null) ?? null,
        nitro_until: (profile.nitro_until as string | null) ?? null,
        value: total,
      }));
  } catch (error) {
    console.error("[leaderboard] failed", error);
    return [];
  }
}

function medal(rank: number) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return (
    <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
      {rank}
    </span>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab: TabId = TABS.some((t) => t.id === sp.tab) ? (sp.tab as TabId) : "comments";
  const rows = await getBoard(tab);
  const activeTab = TABS.find((t) => t.id === tab)!;

  function formatValue(row: BoardRow) {
    if (tab === "donors") return `$${row.value.toLocaleString()}`;
    if (tab === "coins") return `${row.value.toLocaleString()} coins`;
    return `${row.value.toLocaleString()} comments`;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-1 text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold">
          <CrownIcon className="size-6 text-amber-400" />
          Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Top members of Mr.Anime — ranked by activity.
        </p>
      </div>

      <nav className="flex justify-center gap-2" aria-label="Leaderboard categories">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "comments" ? "/leaderboard" : `/leaderboard?tab=${t.id}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
              t.id === tab
                ? "border-sky-500/50 bg-sky-500/10 text-sky-400"
                : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
          No {activeTab.label.toLowerCase()} yet.
        </p>
      ) : (
        <ol className="space-y-2">
          {rows.map((row, i) => (
            <li
              key={`${row.username}-${i}`}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3",
                i === 0 && "border-amber-500/40 bg-amber-500/5",
              )}
            >
              <span className="flex w-8 shrink-0 justify-center">{medal(i + 1)}</span>
              {row.username ? (
                <Link href={`/profile/${row.username}`} className="shrink-0">
                  <Avatar size="sm">
                    {row.avatar_url ? <AvatarImage src={row.avatar_url} alt="" /> : null}
                    <AvatarFallback>{row.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
              ) : null}
              <div className="min-w-0 flex-1">
                {row.username ? (
                  <Link
                    href={`/profile/${row.username}`}
                    className="block truncate text-sm font-medium hover:text-sky-400 hover:underline"
                  >
                    {row.username}
                  </Link>
                ) : (
                  <span className="text-sm font-medium">unknown</span>
                )}
                <UserBadges
                  role={row.role}
                  isVerified={row.is_verified}
                  badges={row.badges}
                  nitro={isNitroActive(row)}
                  className="mt-0.5"
                />
              </div>
              <span className="shrink-0 text-sm font-semibold text-amber-400">
                {formatValue(row)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
