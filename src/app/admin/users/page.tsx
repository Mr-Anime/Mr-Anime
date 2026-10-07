import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UsersTable, type AdminUser } from "@/components/admin/users-table";
import { Button } from "@/components/ui/button";
import { adminGate } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Users" };

const PER_PAGE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }>;
}) {
  const gate = await adminGate();
  if (gate.status === "unconfigured") redirect("/admin");
  if (gate.status !== "ok") {
    redirect(gate.status === "signed-out" ? `/login?next=${encodeURIComponent("/admin/users")}` : "/account");
  }

  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 60);
  const role = sp.role === "admin" || sp.role === "user" ? sp.role : "";
  const status = sp.status === "banned" || sp.status === "active" ? sp.status : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PER_PAGE;

  // Strip characters that would break the PostgREST .or() filter syntax.
  const safeQ = q.replace(/[,()%]/g, " ").trim();

  const admin = createAdminClient();

  let query = admin
    .from("profiles")
    .select("id, username, role, is_verified, is_banned, ban_reason, created_at", {
      count: "exact",
    });
  if (safeQ) query = query.ilike("username", `%${safeQ}%`);
  if (role) query = query.eq("role", role);
  if (status) query = query.eq("is_banned", status === "banned");

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PER_PAGE - 1);

  if (error) {
    return <p className="text-sm text-destructive">Failed to load users: {error.message}</p>;
  }

  const users = (data ?? []) as AdminUser[];
  const total = count ?? users.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q: q || undefined, role: role || undefined, status: status || undefined, page: undefined, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} account{total === 1 ? "" : "s"}
            {q ? <> matching “{q}”</> : null}
          </p>
        </div>
        <nav className="flex items-center gap-2" aria-label="Pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            render={
              page > 1 ? <Link href={qs({ page: page > 1 ? String(page - 1) : undefined })} /> : undefined
            }
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
            render={
              page < totalPages ? <Link href={qs({ page: String(page + 1) })} /> : undefined
            }
          >
            Next
          </Button>
        </nav>
      </div>

      <UsersTable
        users={users}
        selfId={gate.adminId}
        query={q}
        role={role}
        status={status}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
