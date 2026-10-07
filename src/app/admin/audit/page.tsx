import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminGate } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Audit log" };

const PER_PAGE = 50;

type ActionRow = {
  id: string;
  admin_id: string;
  target_user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const gate = await adminGate();
  if (gate.status === "unconfigured") redirect("/admin");
  if (gate.status !== "ok") {
    redirect(
      gate.status === "signed-out"
        ? `/login?next=${encodeURIComponent("/admin/audit")}`
        : "/account",
    );
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PER_PAGE;

  const admin = createAdminClient();

  const { data, count, error } = await admin
    .from("admin_actions")
    .select("id, admin_id, target_user_id, action, details, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PER_PAGE - 1);

  if (error) {
    return <p className="text-sm text-destructive">Failed to load audit log: {error.message}</p>;
  }

  const rows = (data ?? []) as ActionRow[];
  const total = count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const userIds = [
    ...new Set(
      rows.flatMap((r) => [r.admin_id, r.target_user_id]).filter((x): x is string => Boolean(x)),
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Audit log</h2>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} recorded action{total === 1 ? "" : "s"} — append-only.
          </p>
        </div>
        <nav className="flex items-center gap-2" aria-label="Pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            render={page > 1 ? <Link href={`/admin/audit?page=${page - 1}`} /> : undefined}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            render={page < totalPages ? <Link href={`/admin/audit?page=${page + 1}`} /> : undefined}
          >
            Next
          </Button>
        </nav>
      </div>

      <div className="rounded-lg border border-border/60">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No actions recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((row) => {
              const details = row.details ?? {};
              return (
                <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{names[row.admin_id] ?? "Admin"}</span>{" "}
                      <span className="text-muted-foreground">
                        {row.action.replace(/_/g, " ")}
                      </span>{" "}
                      <span className="font-medium">
                        {names[row.target_user_id ?? ""] ??
                          (typeof details.username === "string" ? details.username : "—")}
                      </span>
                    </p>
                    {Object.keys(details).length > 0 ? (
                      <p className="font-mono text-xs break-all text-muted-foreground">
                        {JSON.stringify(details)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {row.action}
                    </Badge>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={row.created_at}
                    >
                      {new Date(row.created_at).toLocaleString()}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
