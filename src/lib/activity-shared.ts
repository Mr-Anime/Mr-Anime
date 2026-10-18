/** UTC "YYYY-MM-DD" key for a date. Shared by server lib + client heatmap. */
export function activityDayKey(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${m}-${d}`;
}

/** Today's UTC day key. */
export function activityTodayKey(): string {
  return activityDayKey(new Date());
}

export type ActivityKind = "watch" | "list_add";

type MinimalClient = {
  from: (table: string) => {
    upsert: (
      row: Record<string, unknown>,
      options?: { onConflict?: string; ignoreDuplicates?: boolean },
    ) => PromiseLike<{ error: { message: string } | null }>;
  };
};

/** Best-effort activity event log (never throws — heatmap is non-critical). */
export async function logActivityEvent(
  supabase: MinimalClient,
  userId: string,
  kind: ActivityKind,
  ref: string,
): Promise<void> {
  try {
    const { error } = await supabase.from("activity_events").upsert(
      {
        user_id: userId,
        kind,
        ref,
        day: activityTodayKey(),
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,kind,ref,day", ignoreDuplicates: true },
    );
    if (error) {
      console.error("[activity] event log failed", error.message);
    }
  } catch (error) {
    console.error("[activity] event log failed", error);
  }
}
