/** Shared list types + helpers (safe to import from client and server). */

export const LIST_STATUSES = [
  "planning",
  "watching",
  "completed",
  "on_hold",
  "dropped",
] as const;

export type ListStatus = (typeof LIST_STATUSES)[number];

export const LIST_STATUS_LABELS: Record<ListStatus, string> = {
  planning: "Plan to Watch",
  watching: "Watching",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
};

export function isListStatus(value: unknown): value is ListStatus {
  return (
    typeof value === "string" &&
    (LIST_STATUSES as readonly string[]).includes(value)
  );
}

export type ListEntry = {
  anilist_id: number;
  status: ListStatus;
  episodes_watched: number;
  updated_at: string;
};

/** Minimal AniList info needed to render a list row. */
export type ListMedia = {
  id: number;
  title: string;
  cover: string | null;
  episodes: number | null;
  format: string | null;
  score: number | null;
};

export type ListItem = {
  entry: ListEntry;
  media: ListMedia | null;
};
