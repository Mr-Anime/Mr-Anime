import type { Metadata } from "next";
import { BanIcon } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { tryCreateClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account suspended",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SuspendedPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const { r } = await searchParams;

  let reason =
    typeof r === "string" && r.length > 0
      ? r.slice(0, 500)
      : "No reason recorded.";

  const supabase = await tryCreateClient();
  const { data } = supabase
    ? await supabase.auth.getClaims()
    : { data: null };

  if (data?.claims) {
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("ban_reason,username")
        .eq("id", data.claims.sub)
        .single();
      if (profile?.ban_reason) reason = profile.ban_reason;
    } catch {
      // service role not configured — fall back to the URL reason
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <BanIcon className="size-8 text-destructive" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Account suspended
        </h1>
        <p className="text-muted-foreground">
          This account has been suspended and cannot sign in.
        </p>
      </div>

      <div className="w-full rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-left">
        <p className="text-xs font-medium uppercase tracking-wide text-destructive">
          Reason
        </p>
        <p className="mt-1 text-sm">{reason}</p>
      </div>

      <p className="text-sm text-muted-foreground">
        Believe this is a mistake? Contact us at{" "}
        <a
          href="mailto:support@mranime.example"
          className="text-foreground underline underline-offset-4"
        >
          support@mranime.example
        </a>{" "}
        or see the <a href="/dmca" className="text-foreground underline underline-offset-4">DMCA page</a>.
      </p>

      {data?.claims ? (
        <form action={logout}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      ) : (
        <Button render={<a href="/login" />} variant="outline">
          Back to sign in
        </Button>
      )}
    </div>
  );
}
