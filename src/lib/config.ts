import "server-only";
import { OAUTH_ENV_FLAGS, OAUTH_PROVIDERS, type OAuthProvider } from "@/lib/oauth";

const bool = (v: string | undefined) => v === "1" || v?.toLowerCase() === "true";

const isProviderEnabled = (provider: OAuthProvider) => {
  const envKey = OAUTH_ENV_FLAGS[provider];
  let envVal: string | undefined;
  if (envKey === "ENABLE_GOOGLE_OAUTH") {
    envVal = process.env.ENABLE_GOOGLE_OAUTH ?? process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH;
  } else if (envKey === "ENABLE_GITHUB_OAUTH") {
    envVal = process.env.ENABLE_GITHUB_OAUTH ?? process.env.NEXT_PUBLIC_ENABLE_GITHUB_OAUTH;
  } else if (envKey === "ENABLE_DISCORD_OAUTH") {
    envVal = process.env.ENABLE_DISCORD_OAUTH ?? process.env.NEXT_PUBLIC_ENABLE_DISCORD_OAUTH;
  }

  if (envVal !== undefined) {
    return bool(envVal);
  }
  // If Supabase URL is present and flag is not explicitly false/0, enable providers by default
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  return hasSupabase;
};

const oauthProviders: OAuthProvider[] = OAUTH_PROVIDERS.filter(isProviderEnabled);

export const siteConfig = {
  name: "Mr.Anime",
  tagline: "Stream anime. By Bazil (Biytri Technology).",
  description:
    "Mr.Anime is a fast, modern anime streaming site. Browse trending, seasonal and top-rated anime, and watch episodes with a clean, cinematic player.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  author: "Bazil (Biytri Technology)",
  attribution:
    "Data from AniList, Kitsu and TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.",
  requireLoginToWatch: bool(process.env.REQUIRE_LOGIN_TO_WATCH),
  oauthProviders,
} as const;

export const cacheTtl = {
  trending: 60 * 60,
  details: 60 * 60 * 6,
  search: 60 * 10,
} as const;
