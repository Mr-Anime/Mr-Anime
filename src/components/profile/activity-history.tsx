"use client";

import { useState } from "react";
import { activityDayKey } from "@/lib/activity-shared";
import { cn } from "cn";

/**
 * GitHub-style comment activity heatmap (last 26 weeks).
 * Hover a cell for date + amount tooltip.
 */

const WEEKS = 26;
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

type Tip = { x: number; y: number; key: string; count: number };

export function ActivityHistory({
  counts,
  className,
}: {
  counts: Record<string, number>;
  className?: string;
}) {
  const [tip, setTip] = useState<Tip | null>(null);

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const todayDow = (today.getUTCDay() + 6) % 7; // Mon = 0
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - todayDow - (WEEKS - 1) * 7);

  const weeks: { key: string; count: number; future: boolean }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col: { key: string; count: number; future: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setUTCDate(start.getUTCDate() + w * 7 + d);
      const key = activityDayKey(dt);
      col.push({
        key,
        count: counts[key] ?? 0,
        future: dt.getTime() > today.getTime(),
      });
    }
    weeks.push(col);
  }

  return (
    <section
      aria-label="Activity history"
      className={cn(
        "rounded-xl border border-border/60 bg-card p-4",
        className,
      )}
    >
      <h3 className="mb-3 text-sm font-semibold tracking-tight">
        Activity History
      </h3>
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-[3px]">
          {weeks.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {col.map((cell) =>
                cell.future ? (
                  <span key={cell.key} className="size-[11px]" aria-hidden="true" />
                ) : (
                  <button
                    key={cell.key}
                    type="button"
                    aria-label={`${cell.key}: ${cell.count} comments`}
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
        </div>
      ) : null}
    </section>
  );
}
