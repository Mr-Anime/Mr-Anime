"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BellIcon,
  CheckCheckIcon,
  ChevronDownIcon,
  LogInIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/comments-shared";
import { NotificationText } from "@/components/notifications/notification-text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";

type Notification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type Supa = ReturnType<typeof createClient>;

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const [status, setStatus] = useState<"loading" | "anon" | "auth">("loading");
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);
  const supaRef = useRef<Supa | null>(null);

  const fetchPage = useCallback(async (offset: number) => {
    const supa = supaRef.current;
    if (!supa) return [] as Notification[];
    const { data } = await supa
      .from("notifications")
      .select("id, title, body, created_at, read_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    return (data ?? []) as Notification[];
  }, []);

  async function markRead(n: Notification) {
    const supa = supaRef.current;
    if (!supa || n.read_at) return;
    const now = new Date().toISOString();
    const { error } = await supa
      .from("notifications")
      .update({ read_at: now })
      .eq("id", n.id)
      .is("read_at", null);
    if (error) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: now } : x)));
    setUnread((prev) => Math.max(0, prev - 1));
    setSelected((prev) => (prev && prev.id === n.id ? { ...prev, read_at: now } : prev));
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
    setItems((prev) => prev.map((x) => ({ ...x, read_at: now })));
    setUnread(0);
    setSelected((prev) => (prev ? { ...prev, read_at: now } : prev));
  }

  async function loadMore() {
    const rows = await fetchPage(items.length);
    setItems((prev) => [...prev, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let supa: Supa;
      try {
        supa = createClient();
      } catch {
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

      const rows = await fetchPage(0);
      if (cancelled) return;
      setItems(rows);
      setHasMore(rows.length === PAGE_SIZE);
      const { count } = await supa
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (!cancelled && typeof count === "number") setUnread(count);

      // Deep link: /notifications?open=<id> (from the bell dropdown).
      const openId = new URLSearchParams(window.location.search).get("open");
      if (!cancelled && openId) {
        let target = rows.find((r) => r.id === openId) ?? null;
        if (!target) {
          const { data: single } = await supa
            .from("notifications")
            .select("id, title, body, created_at, read_at")
            .eq("id", openId)
            .single();
          target = (single as Notification | null) ?? null;
        }
        if (!cancelled && target) {
          setSelected(target);
          if (!target.read_at) void markRead(target);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-3 px-4 py-8">
        <Skeleton className="h-8 w-48" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (status === "anon") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-28 text-center">
        <BellIcon className="size-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Sign in for notifications</h1>
        <p className="text-sm text-muted-foreground">
          Admin updates and announcements show up here.
        </p>
        <Button render={<Link href="/login?next=/notifications" />}>
          <LogInIcon />
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          {unread > 0 ? (
            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-400">
              {unread} unread
            </span>
          ) : null}
        </div>
        {unread > 0 ? (
          <Button size="sm" variant="secondary" onClick={() => void markAllRead()}>
            <CheckCheckIcon />
            Mark all read
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-14 text-center">
          <BellIcon className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No notifications yet</p>
          <p className="text-xs text-muted-foreground">
            Admin announcements will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                setSelected(n);
                if (!n.read_at) void markRead(n);
              }}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !n.read_at && "bg-sky-500/5",
              )}
            >
              <span
                className={cn(
                  "mt-2 size-2 shrink-0 rounded-full",
                  n.read_at ? "bg-transparent" : "bg-sky-400",
                )}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 space-y-0.5">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{n.title}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                    {timeAgo(n.created_at)}
                  </span>
                </span>
                {n.body ? (
                  <span className="line-clamp-2 block whitespace-pre-wrap text-xs text-muted-foreground">
                    <NotificationText text={n.body} />
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <Button size="sm" variant="secondary" onClick={() => void loadMore()}>
            <ChevronDownIcon />
            Load more
          </Button>
        </div>
      ) : null}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected ? timeAgo(selected.created_at) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap pr-1 text-sm leading-relaxed">
            <NotificationText text={selected?.body ?? ""} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
