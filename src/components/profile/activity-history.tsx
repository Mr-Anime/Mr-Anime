"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FlameIcon } from "lucide-react";
import { activityDayKey } from "@/lib/activity-shared";
import type { ActivityBreakdown, ActivityData } from "@/lib/activity";
import { cn } from "cn";

/**
 * GitHub-style activity heatmap (comments · watch · list · forum · ratings).
 * Hover a cell for the date + per-kind breakdown; toggle 6 months / 1 year.
 */

const LEVEL_CLASSES = [
  "bg-muted/40",
  "bg-sky-500/25",
  "bg-sky-500/45",
  "bg-sky-500/70",
  "bg-sky-400",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const KIND_META: {
  kind: keyof ActivityBreakdown;
  label: string;
  dot: string;
  symbol: string;
}[] = [
  { kind: "comments", label: "Comments", dot: "bg-sky-400", symbol: "💬" },
  { kind: "watch", label: "Watched", dot: "bg-emerald-400", symbol: "📺" },
  { kind: "list_add", label: "List added", dot: "bg-amber-400", symbol: "📋" },
  { kind: "forum", label: "Forum", dot: "bg-purple-400", symbol: "🗨️" },
  { kind: "rating", label: "Rated", dot: "bg-rose-400", symbol: "⭐" },
];

function formatTip(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const wd = WEEKDAYS[date.getUTCDay()];
  const mo = MONTHS[date.getUTCMonth()];
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${wd} ${mo} ${day} ${y}`;
}

function level(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
}

type Tip = { x: number; y: number; key: string; count: number; b: ActivityBreakdown | null };

export function ActivityHistory({
  data,
  range = "6m",
  className,
}: {
  data: ActivityData;
  range?: "6m" | "1y";
  className?: string;
}) {
  const [tip, setTip] = useState<Tip | null>(null);
  const pathname = usePathname();

  const weeks = range === "1y" ? 53 : 26;
  const rangeLabel = range === "1y" ? "Last year" : "Last 6 months";

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const todayDow = (today.getUTCDay() + 6) % 7; // Mon = 0
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - todayDow - (weeks - 1) * 7);

  const grid: { key: string; count: number; future: boolean }[][] = [];
  const monthLabels: (string | null)[] = [];
  let lastLabelMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const col: { key: string; count: number; future: boolean }[] = [];
    let label: string | null = null;
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setUTCDate(start.getUTCDate() + w * 7 + d);
      const key = activityDayKey(dt);
      col.push({
        key,
        count: data.counts[key] ?? 0,
        future: dt.getTime() > today.getTime(),
      });
      if (dt.getUTCDate() === 1 && dt.getUTCMonth() !== lastLabelMonth) {
        lastLabelMonth = dt.getUTCMonth();
        label = MONTHS[dt.getUTCMonth()];
      }
    }
    grid.push(col);
    monthLabels.push(label);
  }

  return (
    <section
      aria-label="Activity history"
      className={cn(
        "rounded-xl border border-border/60 bg-card p-4",
        className,
      )}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">Activity History</h3>
        <nav className="flex gap-1 text-xs" aria-label="Heatmap range">
          <Link
            href={pathname}
            className={cn(
              "rounded-full px-2 py-0.5 transition-colors",
              range === "6m"
                ? "bg-sky-500/15 text-sky-400"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            6 months
          </Link>
          <Link
            href={`${pathname}?range=year`}
            className={cn(
              "rounded-full px-2 py-0.5 transition-colors",
              range === "1y"
                ? "bg-sky-500/15 text-sky-400"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            1 year
          </Link>
        </nav>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        {rangeLabel}: <span className="font-medium text-foreground">{data.total}</span>{" "}
        activities
      </p>

      <div className="overflow-x-auto pb-1">
        <div className="w-max">
          <div className="mb-1 flex gap-[3px] pl-7 text-[10px] text-muted-foreground">
            {monthLabels.map((label, i) => (
              <span key={i} className="w-[11px] shrink-0 overflow-visible whitespace-nowrap">
                {label ?? ""}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            <div className="mr-1 flex w-6 flex-col gap-[3px] text-[9px] text-muted-foreground">
              {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((d, i) => (
                <span key={i} className="flex h-[11px] items-center">
                  {d}
                </span>
              ))}
            </div>
            {grid.map((col, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {col.map((cell) =>
                  cell.future ? (
                    <span key={cell.key} className="size-[11px]" aria-hidden="true" />
                  ) : (
                    <button
                      key={cell.key}
                      type="button"
                      aria-label={`${cell.key}: ${cell.count} activities`}
                      className={cn(
                        "size-[11px] rounded-[3px] transition-colors",
                        LEVEL_CLASSES[level(cell.count)],
                      )}
                      onMouseEnter={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setTip({
                          x: r.left + r.width / 2,
                          y: r.top,
                          key: cell.key,
                          count: cell.count,
                          b: data.breakdown[cell.key] ?? null,
                        });
                      }}
                      onMouseLeave={() => setTip(null)}
                      onFocus={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setTip({
                          x: r.left + r.width / 2,
                          y: r.top,
                          key: cell.key,
                          count: cell.count,
                          b: data.breakdown[cell.key] ?? null,
                        });
                      }}
                      onBlur={() => setTip(null)}
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {tip ? (
        <div
          role="tooltip"
          className="pointer-events-none fixed top-0 left-0 z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-border/60 bg-popover px-3 py-2 text-sm shadow-lg"
          style={{ left: tip.x, top: tip.y - 8 }}
        >
          <p className="font-semibold whitespace-nowrap">{formatTip(tip.key)}</p>
          <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
            <span className="size-2 rounded-full bg-sky-400" />
            Amount: {tip.count}
          </p>
          {tip.b
            ? KIND_META.filter((k) => tip.b && tip.b[k.kind] > 0).map((k) => (
                <p
                  key={k.kind}
                  className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground"
                >
                  <span className={cn("size-2 rounded-full", k.dot)} />
                  {k.symbol} {k.label}: {tip.b?.[k.kind]}
                </p>
              ))
            : null}
        </div>
      ) : null}

      {data.currentStreak > 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <FlameIcon className="size-3.5 text-orange-400" />
          <span className="font-medium text-foreground">
            {data.currentStreak}-day activity streak
          </span>
        </p>
      ) : null}
    </section>
  );
}
