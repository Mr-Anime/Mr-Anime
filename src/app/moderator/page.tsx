import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlertIcon } from "lucide-react";
import {
  ModeratorPanel,
  type ModeratorUser,
} from "@/components/moderator/moderator-panel";
import { Button } from "@/components/ui/button";
import { moderatorGate } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Moderator",
  robots: { index: false, follow: false },
};

// Session-checked per request — never statically prerendered.
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function ModeratorPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const gate = await moderatorGate();

  if (gate.status === "signed-out") {
    redirect(`/login?next=${encodeURIComponent("/moderator")}`);
  }
  if (gate.status === "forbidden") {
    redirect("/account");
  }

  if (gate.status === "unconfigured") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-28 text-center">
        <ShieldAlertIcon className="size-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Supabase is not configured</h1>
        <p className="text-sm text-muted-foreground">
          Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{" "}
          <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in{" "}
          <code className="font-mono">.env.local</code> to use the moderator panel.
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 60);
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PER_PAGE;

  // Strip characters that would break the PostgREST .or() filter syntax.
  const safeQ = q.replace(/[,()%]/g, " ").trim();

  const client = createAdminClient();
  let query = client
    .from("profiles")
    .select("id, username, role, is_verified, is_banned, badges, created_at", {
      count: "exact",
    });
  if (safeQ) query = query.ilike("username", `%${safeQ}%`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PER_PAGE - 1);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <p className="text-sm text-destructive">Failed to load users: {error.message}</p>
      </div>
    );
  }

  const users = (data ?? []) as ModeratorUser[];
  const total = count ?? users.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q: q || undefined, page: undefined, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Moderator panel</h1>
          <p className="text-sm text-muted-foreground">
            Verify members with the Moderator Verified badge — {total.toLocaleString()}{" "}
            account{total === 1 ? "" : "s"}
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

      <ModeratorPanel users={users} selfId={gate.adminId} query={q} />
    </div>
  );
}
