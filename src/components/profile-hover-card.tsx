"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRightIcon, CalendarIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserBadges } from "@/components/user-badges";
import { cosmeticClass, nameClasses, type Cosmetics } from "@/lib/cosmetics";
import { cn } from "cn";

export type ProfileCardData = {
  username: string;
  avatarUrl: string | null;
  role: string;
  isVerified: boolean;
  badges: string[];
  joinedAt: string;
  nitro: boolean;
  cosmetics: Cosmetics;
};

const CARD_WIDTH = 288;
const CARD_HEIGHT = 190;
const OPEN_DELAY = 250;
const CLOSE_DELAY = 350;

const cardCache = new Map<string, Promise<ProfileCardData | null>>();

function fetchProfileCard(username: string): Promise<ProfileCardData | null> {
  let pending = cardCache.get(username);
  if (!pending) {
    pending = fetch(`/api/profile-card/${encodeURIComponent(username)}`)
      .then((res) => (res.ok ? (res.json() as Promise<ProfileCardData>) : null))
      .catch(() => null);
    cardCache.set(username, pending);
  }
  return pending;
}

type Props = {
  username: string;
  children: React.ReactNode;
};

/**
 * Discord-style hover card: hover (or focus) the trigger for a moment and a
 * fixed-position profile card appears with banner, framed avatar, styled
 * name, badges and a link to the full profile.
 */
export function ProfileHoverCard({ username, children }: Props) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ProfileCardData | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  function clearOpenTimer() {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = null;
  }
  function clearCloseTimer() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function show() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    let top = rect.bottom + 8;
    if (top + CARD_HEIGHT > window.innerHeight - 8) {
      top = Math.max(8, rect.top - CARD_HEIGHT - 8);
    }
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - CARD_WIDTH - 8),
    );
    setPos({ top, left });
    setOpen(true);
    void fetchProfileCard(username).then((result) => {
      setData((current) => current ?? result);
    });
  }

  function scheduleOpen() {
    clearCloseTimer();
    clearOpenTimer();
    openTimer.current = setTimeout(show, OPEN_DELAY);
  }

  function scheduleClose() {
    clearOpenTimer();
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  }

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function close() {
      setOpen(false);
    }
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close, { passive: true });
    return () => {
      window.removeEventListener("scroll", close, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const joined = data
    ? new Date(data.joinedAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex"
        onPointerEnter={scheduleOpen}
        onPointerLeave={scheduleClose}
        onFocusCapture={scheduleOpen}
        onBlurCapture={scheduleClose}
      >
        {children}
      </span>

      {open && pos ? (
        <div
          role="dialog"
          aria-label={`${username}'s profile card`}
          className={cn(
            "fixed z-50 overflow-hidden rounded-xl border border-border/60 bg-popover/95 shadow-2xl backdrop-blur-md",
            data?.nitro && "nitro-flame border-transparent",
          )}
          style={{ top: pos.top, left: pos.left, width: CARD_WIDTH }}
          onPointerEnter={clearCloseTimer}
          onPointerLeave={scheduleClose}
        >
          <div
            className={cn(
              "h-12 w-full",
              data
                ? "bg-gradient-to-r from-sky-500/40 via-fuchsia-500/30 to-amber-400/40"
                : "bg-muted",
            )}
          />
          <div className="space-y-3 px-4 pb-4">
            <div className="-mt-6">
              <span
                className={cn(
                  "inline-flex rounded-full",
                  data && cosmeticClass(data.cosmetics?.frame),
                  data?.nitro && "nitro-avatar-glow",
                )}
              >
                <Avatar size="lg">
                  {data?.avatarUrl ? <AvatarImage src={data.avatarUrl} alt="" /> : null}
                  <AvatarFallback className="bg-background font-semibold">
                    {username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </span>
            </div>

            {data ? (
              <>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={cn("text-sm font-semibold", nameClasses(data.cosmetics))}
                    >
                      {data.username}
                    </span>
                    <UserBadges
                      role={data.role}
                      isVerified={data.isVerified}
                      badges={data.badges}
                      nitro={data.nitro}
                    />
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarIcon className="size-3" />
                    Joined {joined}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  render={<Link href={`/profile/${data.username}`} />}
                >
                  View profile
                  <ArrowUpRightIcon className="size-3.5" />
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                <div className="h-8 w-full animate-pulse rounded bg-muted" />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
