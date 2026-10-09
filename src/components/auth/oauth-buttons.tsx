"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OAUTH_PROVIDER_LABELS, type OAuthProvider } from "@/lib/oauth";
import { createClient } from "@/lib/supabase/client";

/**
 * "Continue with …" buttons, rendered under the password form when at
 * least one provider flag is enabled. First sign-in creates the account.
 */
export function OAuthButtons({
  providers,
  next,
}: {
  providers: OAuthProvider[];
  next: string;
}) {
  if (providers.length === 0) return null;

  async function signInWithOAuth(provider: OAuthProvider) {
    const label = OAUTH_PROVIDER_LABELS[provider];
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        toast.error(error.message || `${label} sign-in is not available.`);
      }
    } catch {
      toast.error(`${label} sign-in is not configured on this server.`);
    }
  }

  return (
    <>
      <div className="relative py-1 text-center text-xs text-muted-foreground">
        <span className="relative z-10 bg-card px-2">or</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
      </div>
      <div className="space-y-2">
        {providers.map((provider) => (
          <Button
            key={provider}
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => void signInWithOAuth(provider)}
          >
            Continue with {OAUTH_PROVIDER_LABELS[provider]}
          </Button>
        ))}
      </div>
    </>
  );
}
