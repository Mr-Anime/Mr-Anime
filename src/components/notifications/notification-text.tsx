"use client";

import Link from "next/link";
import { Fragment } from "react";

/**
 * Renders notification text with colored links and @mentions.
 * URLs open in a new tab; @names link to /profile/<name>.
 */

const TOKEN_SOURCE =
  "https?://[^\\s<>\"']+|www\\.[^\\s<>\"']+|@[A-Za-z0-9_]{3,20}";

function trimPunct(value: string): string {
  return value.replace(/[.,;:!?)\]}'"]+$/, "");
}

export function NotificationText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const match of text.matchAll(new RegExp(TOKEN_SOURCE, "g"))) {
    const index = match.index ?? 0;
    if (index > last) {
      parts.push(<Fragment key={key++}>{text.slice(last, index)}</Fragment>);
    }
    const token = match[0];

    if (token.startsWith("@")) {
      parts.push(
        <Link
          key={key++}
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
          key={key++}
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
    parts.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  }

  return <span className={className}>{parts}</span>;
}
