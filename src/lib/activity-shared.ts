/** UTC "YYYY-MM-DD" key for a date. Shared by server lib + client heatmap. */
export function activityDayKey(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${m}-${d}`;
}
