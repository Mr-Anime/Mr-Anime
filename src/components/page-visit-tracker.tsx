"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const STATS_ENDPOINT = "https://stats.mranime.cyou/track";

/** Records a page visit on first load and on every client-side navigation. */
export function PageVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    fetch(`${STATS_ENDPOINT}?path=${encodeURIComponent(pathname)}`, {
      cache: "no-store",
      keepalive: true,
    }).catch((err) => console.error("Stats tracking failed", err));
  }, [pathname]);

  return null;
}
