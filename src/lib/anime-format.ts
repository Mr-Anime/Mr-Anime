/** Current anime season (AniList: WINTER/SPRING/SUMMER/FALL). */
export function currentSeason(date = new Date()): "WINTER" | "SPRING" | "SUMMER" | "FALL" {
  const m = date.getMonth();
  if (m <= 1 || m === 11) return "WINTER";
  if (m <= 4) return "SPRING";
  if (m <= 7) return "SUMMER";
  return "FALL";
}

export function currentSeasonYear(date = new Date()): number {
  return date.getFullYear();
}

export const ANIME_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
] as const;

export const SEASON_LABELS: Record<string, string> = {
  WINTER: "Winter",
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
};

export function mediaTitle(media: {
  title?: { english?: string | null; romaji?: string | null; native?: string | null };
}): string {
  return media.title?.english || media.title?.romaji || media.title?.native || "Untitled";
}

export function mediaYear(media: { startDate?: { year?: number | null } }): number | null {
  return media.startDate?.year ?? null;
}
