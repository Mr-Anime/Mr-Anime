"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Refreshes the server component until the donation settles (or attempts run out). */
export function DonateStatusPoller({ done }: { done: boolean }) {
  const router = useRouter();
  const attempts = useRef(0);

  useEffect(() => {
    if (done || attempts.current >= 30) return;
    const timer = setInterval(() => {
      attempts.current += 1;
      router.refresh();
      if (attempts.current >= 30) clearInterval(timer);
    }, 3000);
    return () => clearInterval(timer);
  }, [done, router]);

  return null;
}
