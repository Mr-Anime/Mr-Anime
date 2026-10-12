"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellIcon, CheckCheckIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/comments-shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

type Notification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type Supa = ReturnType<typeof createClient>;

const LIST_LIMIT = 15;

/**
 * Header bell: shows unread count and the latest admin notifications.
 * Reads/marks the signed-in user's own rows via Supabase RLS — no API routes.
 */
export function NotificationBell() {
  const [status, setStatus] = useState<"loading" | "anon" | "auth">("loading");
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const supaRef = useRef<Supa | null>(null);

  const load = useCallback(async () => {
    const supa = supaRef.current;
    if (!supa) return;
    const [listRes, countRes] = await Promise.all([
      supa
        .from("notifications")
        .select("id, title, body, created_at, read_at")
        .order("created_at", { ascending: false })
        .limit(LIST_LIMIT),
      supa
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null),
    ]);
    if (listRes.data) setItems(listRes.data as Notification[]);
    if (typeof countRes.count === "number") setUnread(countRes.count);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let supa: Supa;
      try {
        supa = createClient();
      } catch {
        // Supabase not configured locally — render nothing.
        if (!cancelled) setStatus("anon");
        return;
      }
      const { data, error } = await supa.auth.getClaims();
      if (error || !data?.claims) {
        if (!cancelled) setStatus("anon");
        return;
      }
      if (cancelled) return;
      supaRef.current = supa;
      setStatus("auth");
      await load();
    })();

    function refresh() {
      if (supaRef.current) void load();
    }
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [load]);

  async function markRead(id: string) {
    const supa = supaRef.current;
    if (!supa) return;
    const now = new Date().toISOString();
    const { error } = await supa
      .from("notifications")
      .update({ read_at: now })
      .eq("id", id)
      .is("read_at", null);
    if (error) return;
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: now } : n)),
    );
    setUnread((prev) => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    const supa = supaRef.current;
    if (!supa) return;
    const now = new Date().toISOString();
    const { error } = await supa
      .from("notifications")
      .update({ read_at: now })
      .is("read_at", null);
    if (error) return;
    setItems((prev) => prev.map((n) => ({ ...n, read_at: now })));
    setUnread(0);
  }

  if (status === "loading") {
    return <Skeleton className="size-8 rounded-md" aria-label="Loading notifications" />;
  }
  if (status === "anon") return null;

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) void load(); }}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="relative size-9 rounded-md"
            aria-label={
              unread > 0 ? `Notifications (${unread} unread)` : "Notifications"
            }
          />
        }
      >
        <BellIcon className="size-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between font-normal">
            <span className="font-medium text-foreground">Notifications</span>
            {unread > 0 ? (
              <span className="text-xs text-sky-400">{unread} new</span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {items.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            You&apos;re all caught up.
          </DropdownMenuItem>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex-col items-start gap-0.5 py-2"
              onClick={() => void markRead(n.id)}
            >
              <span className="flex w-full items-center gap-1.5">
                {!n.read_at ? (
                  <span className="size-1.5 shrink-0 rounded-full bg-sky-400" />
                ) : null}
                <span className="truncate text-sm font-medium">{n.title}</span>
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                  {timeAgo(n.created_at)}
                </span>
              </span>
              {n.body ? (
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {n.body}
                </span>
              ) : null}
            </DropdownMenuItem>
          ))
        )}

        {unread > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void markAllRead()}>
              <CheckCheckIcon />
              Mark all as read
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
