/** Supported OAuth login providers (Supabase Auth must enable each one). */

export type OAuthProvider = "google" | "github" | "discord";

export const OAUTH_PROVIDERS: OAuthProvider[] = ["google", "github", "discord"];

export const OAUTH_PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: "Google",
  github: "GitHub",
  discord: "Discord",
};

/** Env flag that shows the provider's sign-in button (1 / true). */
export const OAUTH_ENV_FLAGS: Record<OAuthProvider, string> = {
  google: "ENABLE_GOOGLE_OAUTH",
  github: "ENABLE_GITHUB_OAUTH",
  discord: "ENABLE_DISCORD_OAUTH",
};
