"use client";

import { useState } from "react";
import { EyeOffIcon } from "lucide-react";
import { parseSpoilers } from "@/lib/spoilers";
import { cn } from "cn";

/** Renders comment text with [spoiler]...[/spoiler] blurred until tapped. */
export function SpoilerText({ text, className }: { text: string; className?: string }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const segments = parseSpoilers(text);

  function reveal(index: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }

  return (
    <p className={cn("text-sm leading-relaxed whitespace-pre-wrap break-words", className)}>
      {segments.map((segment, i) =>
        segment.spoiler ? (
          <button
            key={i}
            type="button"
            onClick={() => reveal(i)}
            aria-label="Reveal spoiler"
            className={cn(
              "mx-0.5 inline-flex cursor-pointer items-center gap-1 rounded bg-muted/80 px-1 align-baseline text-[13px] transition-all",
              revealed.has(i)
                ? "text-foreground"
                : "select-none text-transparent blur-[5px] hover:blur-[3px]",
            )}
          >
            {!revealed.has(i) ? <EyeOffIcon className="size-3 shrink-0 text-muted-foreground" /> : null}
            {segment.text}
          </button>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </p>
  );
}
