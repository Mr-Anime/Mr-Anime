"use client";

import { useEffect } from "react";
import { recordWatch } from "@/app/actions/progress";

/** Silently records watch progress for continue-watching + stats. */
export function WatchProgressRecorder({
  anilistId,
  episode,
  enabled,
}: {
  anilistId: number;
  episode: number;
  enabled: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;
    void recordWatch(anilistId, episode);
  }, [anilistId, episode, enabled]);

  return null;
}
