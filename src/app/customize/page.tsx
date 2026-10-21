import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomizeClient } from "@/components/customize/customize-client";
import { userFrameClass } from "@/lib/cosmetics";
import { getLoadout } from "@/lib/loadouts";
import { isNitroActive } from "@/lib/nitro";
import { getTitleUnlocks, getProfilePrefs } from "@/lib/prefs-server";
import { tryCreateClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Customize Profile",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CustomizePage() {
  const supabase = await tryCreateClient();
  if (!supabase) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-28 text-center">
        <h1 className="text-xl font-semibold">Supabase is not configured</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
          <code className="font-mono">.env.local</code>.
        </p>
      </div>
    );
  }
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims?.sub) redirect("/login?next=/customize");
  const userId = authData.claims.sub;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, role, is_verified, badges, nitro_until")
    .eq("id", userId)
    .single();
  if (!profile) redirect("/login?next=/customize");

  const badges = (profile.badges as string[] | null) ?? [];
  const nitro = isNitroActive({
    badges,
    nitro_until: profile.nitro_until as string | null,
  });

  const prefs = await getProfilePrefs(userId);
  const cosmetics = await getLoadout(userId);
  const frameClass = userFrameClass(profile.username, cosmetics);
  const { unlocked, points } = await getTitleUnlocks(userId, {
    badges,
    nitro,
    role: profile.role,
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Customize profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a catalog avatar, banner, title, flair and theme — live preview updates as
          you go. Only avatars from the site catalog are allowed.
        </p>
      </header>

      <CustomizeClient
        username={profile.username}
        avatarUrl={profile.avatar_url as string | null}
        frameClass={frameClass}
        role={profile.role}
        isVerified={Boolean(profile.is_verified)}
        badges={badges}
        nitro={nitro}
        initial={prefs}
        unlocked={[...unlocked]}
        points={points}
      />
    </div>
  );
}
