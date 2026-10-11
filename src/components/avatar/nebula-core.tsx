"use client";

import Image from "next/image";
import { cn } from "cn";

/**
 * NEBULA CORE — original futuristic avatar identity frame.
 *
 * Layers (all decorative layers are pointer-events: none):
 *  1. Ambient purple/cyan light pool that "breathes"
 *  2. Rotating gradient energy halo
 *  3. Neon green/cyan energy ring (counter-rotating, glowing)
 *  4. Purple dimensional shards floating past the rim
 *  5. Twinkling particles
 *  6. A small mascot sprite in the bottom corner
 *  7. Optional online dot + level badge + username
 *
 * Pure CSS/SVG — no extra libraries. Respects prefers-reduced-motion.
 */

type Props = {
  /** Avatar image URL (null/missing falls back to the initial). */
  src?: string | null;
  /** Used for the fallback initial + accessible label. */
  username?: string;
  /** Inner avatar diameter in px (decorations extend beyond it). Default 48. */
  size?: number;
  /** Show the green online indicator (bottom-left). */
  online?: boolean;
  /** Show a level pill (top-right), e.g. level={12}. */
  level?: number | null;
  /** Optional username strip under the avatar. */
  showName?: boolean;
  className?: string;
};

/** Shard placements: distance from center (% of shell) + angle (deg). */
const SHARDS = [
  { dist: 46, angle: -95, dur: "5.2s", delay: "0s" },
  { dist: 48, angle: -25, dur: "6.1s", delay: "0.8s" },
  { dist: 47, angle: 55, dur: "5.6s", delay: "1.6s" },
  { dist: 46, angle: 140, dur: "6.4s", delay: "0.4s" },
  { dist: 48, angle: 205, dur: "5.9s", delay: "1.2s" },
  { dist: 45, angle: 260, dur: "6.8s", delay: "2s" },
] as const;

/** Particle placements around the avatar. */
const PARTICLES = [
  { x: 12, y: 22, dur: "3.1s", delay: "0s", size: 3 },
  { x: 84, y: 18, dur: "2.7s", delay: "0.5s", size: 2.5 },
  { x: 90, y: 58, dur: "3.4s", delay: "1.1s", size: 3 },
  { x: 8, y: 62, dur: "2.9s", delay: "1.7s", size: 2.5 },
  { x: 30, y: 6, dur: "3.6s", delay: "0.3s", size: 2 },
  { x: 70, y: 92, dur: "3.2s", delay: "0.9s", size: 2.5 },
  { x: 22, y: 88, dur: "2.6s", delay: "1.4s", size: 2 },
  { x: 94, y: 38, dur: "3.8s", delay: "2.1s", size: 2 },
] as const;

function shardOffset(dist: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist };
}

export function NebulaCore({
  src,
  username,
  size = 48,
  online,
  level,
  showName,
  className,
}: Props) {
  const shell = size + Math.round(size * 0.55); // decorations bleed outside
  const initial = (username ?? "?").charAt(0).toUpperCase();

  return (
    <span
      className={cn("nebula-core inline-flex flex-col items-center gap-1.5", className)}
      style={{ width: shell }}
      role="img"
      aria-label={username ? `${username}'s avatar` : "Avatar"}
    >
      <span className="relative inline-flex items-center justify-center" style={{ width: shell, height: shell }}>
        {/* Decorative layers — never intercept clicks */}
        <span className="nebula-deco" aria-hidden="true">
          <span className="nebula-ambient" />
          <span className="nebula-halo" />
          <span className="nebula-ring" />

          {SHARDS.map((shard, i) => {
            const { x, y } = shardOffset(shard.dist, shard.angle);
            return (
              <span
                key={i}
                className="nebula-shard"
                style={
                  {
                    "--nx": `${x}%`,
                    "--ny": `${y}%`,
                    "--nd": shard.dur,
                    "--dd": shard.delay,
                  } as React.CSSProperties
                }
              />
            );
          })}

          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="nebula-particle"
              style={
                {
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  "--nd": p.dur,
                  "--dd": p.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </span>

        {/* Avatar image — separate from decorations */}
        <span
          className="nebula-image"
          style={{ width: size, height: size }}
        >
          {src ? (
            <Image
              src={src}
              alt=""
              fill
              sizes={`${size}px`}
              className="aspect-square size-full rounded-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-cyan-300">
              {initial}
            </span>
          )}
        </span>

        {/* Mascot sprite */}
        <svg
          className="nebula-mascot"
          viewBox="0 0 40 44"
          fill="none"
          aria-hidden="true"
          style={{ width: Math.max(18, Math.round(size * 0.42)) }}
        >
          <defs>
            <linearGradient id="nebula-mascot-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <radialGradient id="nebula-mascot-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* antennae */}
          <path d="M13 12 L9 3" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
          <path d="M27 12 L31 3" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
          <circle cx="9" cy="3" r="2.4" fill="#a855f7" />
          <circle cx="31" cy="3" r="2.4" fill="#22d3ee" />
          {/* glow + body */}
          <ellipse cx="20" cy="28" rx="19" ry="16" fill="url(#nebula-mascot-glow)" />
          <ellipse cx="20" cy="26" rx="13" ry="12" fill="url(#nebula-mascot-grad)" />
          {/* eyes */}
          <ellipse cx="15.5" cy="24" rx="3.2" ry="3.6" fill="#f0f9ff" />
          <ellipse cx="24.5" cy="24" rx="3.2" ry="3.6" fill="#f0f9ff" />
          <circle cx="16.2" cy="24.6" r="1.5" fill="#0b1020" />
          <circle cx="25.2" cy="24.6" r="1.5" fill="#0b1020" />
          {/* smile */}
          <path d="M17 30.5 Q20 33 23 30.5" stroke="#0b1020" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </svg>

        {online !== undefined ? (
          <span className={cn("nebula-online", !online && "nebula-online-off")} aria-hidden="true" />
        ) : null}

        {level != null ? (
          <span className="nebula-level" aria-hidden="true">
            LV {level}
          </span>
        ) : null}
      </span>

      {showName && username ? (
        <span className="max-w-full truncate text-xs font-semibold text-foreground/90">
          {username}
        </span>
      ) : null}
    </span>
  );
}
