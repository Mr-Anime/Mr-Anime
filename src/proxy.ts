import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const requireLoginToWatch =
  process.env.REQUIRE_LOGIN_TO_WATCH === "1" ||
  process.env.REQUIRE_LOGIN_TO_WATCH?.toLowerCase() === "true";

let warnedMissingEnv = false;

/**
 * Next.js 16 replaces middleware.ts with proxy.ts.
 * Refreshes the Supabase session on every request (getClaims() verifies the
 * JWT), then applies optimistic route protection. Authoritative role checks
 * still happen server-side in layouts/server actions.
 */
export async function proxy(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  const redirectTo = (path: string) => {
    const target = NextResponse.redirect(new URL(path, request.url));
    for (const c of supabaseResponse.cookies.getAll()) {
      target.cookies.set(c);
    }
    return target;
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!warnedMissingEnv) {
      warnedMissingEnv = true;
      console.warn(
        "[proxy] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set — " +
          "skipping session refresh and route protection entirely.",
      );
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Verifies the JWT on every call and refreshes expiring sessions.
  const { data, error } = await supabase.auth.getClaims();
  const claims = error ? null : (data?.claims ?? null);
  const { pathname, search } = request.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (claims?.sub) {
    let profile: { role: string; is_banned: boolean } | null = null;
    try {
      const admin = createAdminClient();
      const { data: row, error: profileError } = await admin
        .from("profiles")
        .select("role,is_banned")
        .eq("id", claims.sub)
        .single();
      if (profileError) profile = null;
      else profile = row as { role: string; is_banned: boolean };
    } catch {
      // env not configured yet — fail open for public routes, still protect admin
      profile = null;
    }

    if (!profile) {
      // Session exists but the profile row is gone (deleted user) — sign out.
      await supabase.auth.signOut();
      return redirectTo("/login");
    }

    if (
      profile.is_banned &&
      pathname !== "/suspended" &&
      !pathname.startsWith("/api/") &&
      !pathname.startsWith("/auth/")
    ) {
      return redirectTo("/suspended");
    }

    if (pathname.startsWith("/admin") && profile.role !== "admin") {
      return redirectTo("/account");
    }

    if (isAuthPage) {
      return redirectTo("/");
    }

    return supabaseResponse;
  }

  // Unauthenticated visitors
  const needsAuth =
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin") ||
    (requireLoginToWatch && pathname.startsWith("/watch/"));

  if (needsAuth) {
    const next = encodeURIComponent(pathname + search);
    return redirectTo(`/login?next=${next}`);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
