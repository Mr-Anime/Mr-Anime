"use client";

import Link from "next/link";
import { Fragment } from "react";

/**
 * Renders notification text with colored spans, links and @mentions.
 * Colour tags: [red]text[/red] — palette below. URLs open in a new tab;
 * @names link to /profile/<name>. Unknown/unclosed tags render literally.
 */

const TOKEN_SOURCE =
  "https?://[^\\s<>\"']+|www\\.[^\\s<>\"']+|@[A-Za-z0-9_]{3,20}";

/** Dark-theme friendly palette — shared with the admin send form. */
export const NOTIFICATION_COLORS = {
  red: "#f87171",
  orange: "#fb923c",
  yellow: "#facc15",
  gold: "#fbbf24",
  green: "#4ade80",
  cyan: "#22d3ee",
  blue: "#60a5fa",
  purple: "#c084fc",
  pink: "#f472b6",
} as const;

export type NotificationColorName = keyof typeof NOTIFICATION_COLORS;

function trimPunct(value: string): string {
  return value.replace(/[.,;:!?)\]}'"]+$/, "");
}

function renderPlain(text: string, counter: { n: number }): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(new RegExp(TOKEN_SOURCE, "g"))) {
    const index = match.index ?? 0;
    if (index > last) {
      parts.push(<Fragment key={counter.n++}>{text.slice(last, index)}</Fragment>);
    }
    const token = match[0];

    if (token.startsWith("@")) {
      parts.push(
        <Link
          key={counter.n++}
          href={`/profile/${token.slice(1).toLowerCase()}`}
          className="font-medium text-fuchsia-400 transition-colors hover:text-fuchsia-300"
          onClick={(e) => e.stopPropagation()}
        >
          {token}
        </Link>,
      );
    } else {
      const label = trimPunct(token);
      const href = label.startsWith("www.") ? `https://${label}` : label;
      parts.push(
        <a
          key={counter.n++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 underline underline-offset-2 transition-colors hover:text-sky-300"
          onClick={(e) => e.stopPropagation()}
        >
          {label}
        </a>,
      );
    }
    last = index + token.length;
  }

  if (last < text.length) {
    parts.push(<Fragment key={counter.n++}>{text.slice(last)}</Fragment>);
  }

  return parts;
}

const COLOR_TAG_SOURCE = "\\[([a-z]+)\\]([\\s\\S]*?)\\[\\/\\1\\]";

export function NotificationText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  const counter = { n: 0 };
  let last = 0;

  for (const match of text.matchAll(new RegExp(COLOR_TAG_SOURCE, "g"))) {
    const index = match.index ?? 0;
    if (index > last) {
      parts.push(...renderPlain(text.slice(last, index), counter));
    }
    const name = match[1];
    const inner = match[2];
    const color =
      name in NOTIFICATION_COLORS
        ? NOTIFICATION_COLORS[name as NotificationColorName]
        : null;
    if (color) {
      parts.push(
        <span key={counter.n++} style={{ color }}>
          {renderPlain(inner, counter)}
        </span>,
      );
    } else {
      parts.push(
        <Fragment key={counter.n++}>{`[${name}]${inner}[/${name}]`}</Fragment>,
      );
    }
    last = index + match[0].length;
  }

  if (last < text.length) {
    parts.push(...renderPlain(text.slice(last), counter));
  }

  return <span className={className}>{parts}</span>;
}
