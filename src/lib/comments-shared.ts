/** Shared comment types + helpers (safe to import from client and server). */

import type { Cosmetics } from "@/lib/cosmetics";

export type CommentAuthor = {
  username: string;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  badges: string[];
  /** Equipped shop cosmetics (frame / name style / name animation). */
  cosmetics?: Cosmetics | null;
};

export type CommentView = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author: CommentAuthor | null;
};

export type CommentViewer = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: string;
};

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
