import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth + email-confirmation callback.
 * Exchanges the auth code for a session, then continues to the requested page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next")) ?? "/";
  const oauthError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (oauthError) {
    const message = errorDescription ?? oauthError;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message.slice(0, 300))}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("We could not complete sign-in. Please try again.")}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Missing sign-in code. Please try again.")}`,
  );
}
