import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "*.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "cdn-icons-png.flaticon.com" },
    ],
  },
  async headers() {
    const providerOrigins = getProviderOrigins();
    const supabaseOrigin = getOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
      `frame-src 'self'${providerOrigins
        .map((o) => ` ${o}`)
        .join("")} https://www.youtube.com https://www.youtube-nocookie.com`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

function getOrigin(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function getProviderOrigins(): string[] {
  const origins = new Set<string>();
  for (const [key, value] of Object.entries(process.env)) {
    if (/^PROVIDER_\d+_BASE$/.test(key) && value) {
      try {
        origins.add(new URL(value).origin);
      } catch {
        // ignore malformed provider base URLs
      }
    }
  }
  return [...origins];
}

export default nextConfig;
