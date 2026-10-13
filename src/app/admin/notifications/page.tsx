import type { Metadata } from "next";
import { BellRingIcon } from "lucide-react";
import { NotificationSendForm } from "@/components/admin/notification-send-form";
import { NotificationText } from "@/components/notifications/notification-text";
import { timeAgo } from "@/lib/comments-shared";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Notifications" };

export const dynamic = "force-dynamic";

type RecentRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  profiles: { username: string } | null;
};

export default async function AdminNotificationsPage() {
  const admin = createAdminClient();

  const [userCountRes, recentRes] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("notifications")
      .select("id, title, body, created_at, read_at, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const userCount = userCountRes.count ?? 0;
  const recent = (recentRes.data ?? []) as unknown as RecentRow[];

  return (
    <div className="space-y-8">
      <section className="max-w-2xl">
        <h2 className="text-lg font-semibold">Send a notification</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Appears in the bell menu of every target user. Audit-logged.
        </p>
        <NotificationSendForm userCount={userCount} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recently sent</h2>
        {recent.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-6 text-sm text-muted-foreground">
            <BellRingIcon className="size-4" />
            Nothing sent yet.
          </p>
        ) : (
          <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
            {recent.map((row) => (
              <div key={row.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{row.title}</span>
                    <span className="text-xs text-muted-foreground">
                      → {row.profiles?.username ?? "deleted user"}
                    </span>
                  </div>
                  {row.body ? (
                    <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                      <NotificationText text={row.body} />
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[11px] text-muted-foreground">
                    {timeAgo(row.created_at)}
                  </span>
                  <span
                    className={
                      row.read_at
                        ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400"
                        : "rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400"
                    }
                  >
                    {row.read_at ? "Read" : "Unread"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
