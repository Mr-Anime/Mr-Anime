import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldAlertIcon } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { adminGate } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: { template: "%s · Admin", default: "Admin" },
  robots: { index: false, follow: false },
};

// Session-checked per request — never statically prerendered.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gate = await adminGate();

  if (gate.status === "signed-out") {
    redirect(`/login?next=${encodeURIComponent("/admin")}`);
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
          <code className="font-mono">.env.local</code> to use the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          User management and audit trail — every action is logged.
        </p>
      </div>
      <AdminNav />
      <div>{children}</div>
    </div>
  );
}
