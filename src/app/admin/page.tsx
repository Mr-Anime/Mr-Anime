import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  ShieldCheckIcon,
  UserMinusIcon,
  UsersIcon,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

// Computed once per process (module load) — render stays pure.
const WEEK_AGO = Date.now() - 7 * 24 * 60 * 60 * 1000;

type ProfileRow = {
  id: string;
  role: string;
  is_banned: boolean;
  is_verified: boolean;
  created_at: string;
};

type ActionRow = {
  id: string;
  admin_id: string;
  target_user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  const [{ data: profiles, error: profilesError }, { data: actions, error: actionsError }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, role, is_banned, is_verified, created_at")
        .order("created_at", { ascending: false })
        .limit(10000),
      admin
        .from("admin_actions")
        .select("id, admin_id, target_user_id, action, details, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  if (profilesError || actionsError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load admin data:{" "}
        {profilesError?.message ?? actionsError?.message ?? "unknown error"}
      </p>
    );
  }

  const rows = (profiles ?? []) as ProfileRow[];

  const stats = {
    total: rows.length,
    admins: rows.filter((r) => r.role === "admin").length,
    banned: rows.filter((r) => r.is_banned).length,
    verified: rows.filter((r) => r.is_verified).length,
    newWeek: rows.filter((r) => new Date(r.created_at).getTime() > WEEK_AGO).length,
  };

  const recent = (actions ?? []) as ActionRow[];
  const userIds = [
    ...new Set(
      recent.flatMap((a) => [a.admin_id, a.target_user_id]).filter((x): x is string => Boolean(x)),
    ),
  ];
  let names: Record<string, string> = {};
  if (userIds.length) {
    const { data: nameRows } = await admin
      .from("profiles")
      .select("id, username")
      .in("id", userIds);
    names = Object.fromEntries((nameRows ?? []).map((r) => [r.id, r.username]));
  }

  const cards = [
    { label: "Total users", value: stats.total, icon: UsersIcon },
    { label: "Admins", value: stats.admins, icon: ShieldCheckIcon },
    { label: "Banned", value: stats.banned, icon: UserMinusIcon },
    { label: "Owner verified", value: stats.verified, icon: BadgeCheckIcon },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="py-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {stats.newWeek} new account{stats.newWeek === 1 ? "" : "s"} in the last 7 days.
        </p>
        <Button render={<Link href="/admin/users" />} variant="outline" size="sm">
          Manage users
          <ArrowRightIcon />
        </Button>
      </div>

      <section className="space-y-3" aria-label="Recent activity">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
          <Link href="/admin/audit" className="text-sm text-sky-500 hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No admin actions recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <span className="font-medium">{names[a.admin_id] ?? "Admin"}</span>{" "}
                  <span className="text-muted-foreground">
                    {a.action.replace(/_/g, " ")}
                  </span>{" "}
                  <span className="font-medium">
                    {names[a.target_user_id ?? ""] ??
                      (typeof a.details?.username === "string" ? a.details.username : "")}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {a.action}
                  </Badge>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={a.created_at}
                    suppressHydrationWarning
                  >
                    {new Date(a.created_at).toLocaleString()}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
