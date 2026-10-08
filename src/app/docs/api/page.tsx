import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "API Docs",
  description:
    "REST API for anime search, trending, seasonal and title details. Free with API tokens.",
};

const BASE = `${siteConfig.url}/api/v1`;

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-4 font-mono text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="space-y-4 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

const endpoints = [
  ["GET", "/anime/trending", "Currently trending anime, newest first."],
  ["GET", "/anime/popular", "Most popular anime of all time."],
  ["GET", "/anime/top", "Highest-rated anime."],
  ["GET", "/anime/seasonal", "Browse a season (defaults to the current one)."],
  ["GET", "/anime/search", "Search with filters (q, genre, year, status…)."],
  ["GET", "/anime/{id}", "Full details for a single anime by AniList id."],
] as const;

const errors = [
  ["missing_token", "401", "No bearer token supplied."],
  ["invalid_token", "401", "Token does not exist."],
  ["token_revoked", "401", "Token was revoked."],
  ["rate_limited", "429", "More than 60 requests/minute. Retry after the `Retry-After` header."],
  ["invalid_params", "400", "Query parameter failed validation."],
  ["not_found", "404", "No anime exists with that id."],
  ["upstream_rate_limited", "429", "Upstream data provider is rate limiting us. Retry shortly."],
  ["upstream_error", "502", "Upstream data provider is unavailable."],
  ["auth_unavailable", "503", "Token verification temporarily unavailable. Retry."],
] as const;

const fields = [
  ["id", "number", "AniList id — use it on `/anime/{id}` and the site (`/anime/{id}`)."],
  ["title", "object", "`romaji`, `english`, `native` strings (nullable)."],
  ["format", "string", "`TV`, `MOVIE`, `OVA`, `ONA`, `SPECIAL`… (nullable)."],
  ["status", "string", "`RELEASING`, `FINISHED`, `NOT_YET_RELEASED`, `CANCELLED`, `HIATUS` (nullable)."],
  ["episodes", "number | null", "Total episode count."],
  ["duration", "number | null", "Minutes per episode."],
  ["season / seasonYear", "string / number", "`WINTER`, `SPRING`, `SUMMER`, `FALL` + year."],
  ["startDate / endDate", "object", "`{ year, month, day }`, nullable parts."],
  ["score / meanScore", "number | null", "Score as 0–100."],
  ["popularity / favourites", "number | null", "AniList popularity counts."],
  ["genres", "string[]", "Genre names."],
  ["description", "string | null", "Plain-text synopsis (HTML removed)."],
  ["cover", "object | null", "`{ extraLarge, large, color }` image URLs."],
  ["banner", "string | null", "Banner image URL."],
  ["studios", "string[]", "Studio names."],
  ["nextAiringEpisode", "object | null", "`{ episode, airingAt }` — `airingAt` is a Unix timestamp."],
  ["isAdult", "boolean", "Adult flag."],
] as const;

export default function ApiDocsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-10 space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Mr.Anime API</h1>
        <p className="text-sm text-muted-foreground">
          A free REST API over the same data the site uses — search, trending, seasonal and
          per-title details. Authenticate with a personal bearer token.
        </p>
        <Code>{`Base URL: ${BASE}`}</Code>
      </div>

      <div className="space-y-12">
        <Section id="quickstart" title="Quickstart">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Create a token on your{" "}
              <Link href="/account" className="text-sky-500 underline-offset-4 hover:underline">
                account page
              </Link>{" "}
              (API tokens card). It is shown once — copy it.
            </li>
            <li>Send it as a bearer token on every request.</li>
          </ol>
          <Code>{`curl -H "Authorization: Bearer ma_live_YOUR_TOKEN" \\
  "${BASE}/anime/search?q=naruto&perPage=5"`}</Code>
          <Code>{`// JavaScript
const res = await fetch("${BASE}/anime/trending?perPage=10", {
  headers: { Authorization: \`Bearer \${process.env.MRANIME_API_TOKEN}\` },
});
const { data, pageInfo } = await res.json();`}</Code>
        </Section>

        <Section id="auth" title="Authentication">
          <p>
            Every request needs a token in the{" "}
            <code className="font-mono text-foreground">Authorization</code> header as{" "}
            <code className="font-mono text-foreground">Bearer ma_live_…</code> (an{" "}
            <code className="font-mono text-foreground">X-API-Key</code> header works too). Tokens
            start with <code className="font-mono text-foreground">ma_live_</code>, are stored hashed
            server-side, and only the SHA-256 hash is kept — losing the token means revoking it and
            creating a new one. Revocation takes effect immediately.
          </p>
          <p>
            <strong className="text-foreground">Rate limit:</strong> 60 requests per minute per
            token. Over-limit responses are <code className="font-mono text-foreground">429</code>{" "}
            with a <code className="font-mono text-foreground">Retry-After</code> header; every
            success carries <code className="font-mono text-foreground">X-RateLimit-Remaining</code>.
            Responses are CDN-cached for 10 minutes to 1 hour, so repeat reads are cheap.
          </p>
          <p>
            CORS is enabled (<code className="font-mono text-foreground">Access-Control-Allow-Origin: *</code>
            ), so the API can be called directly from browser apps.
          </p>
        </Section>

        <Section id="endpoints" title="Endpoints">
          <div className="overflow-x-auto rounded-md border border-border/60">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/60 bg-muted/40 text-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Method</th>
                  <th className="px-3 py-2 font-medium">Path (under {`/api/v1`})</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {endpoints.map(([method, path, description]) => (
                  <tr key={path}>
                    <td className="px-3 py-2 font-mono text-sky-500">{method}</td>
                    <td className="px-3 py-2 font-mono">{path}</td>
                    <td className="px-3 py-2">{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Common query parameters</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <code className="font-mono text-foreground">page</code> — 1…500, default 1.
              </li>
              <li>
                <code className="font-mono text-foreground">perPage</code> — 1…50, default 24.
              </li>
              <li>
                <code className="font-mono text-foreground">search</code>:{" "}
                <code className="font-mono text-foreground">q</code> (max 200 chars),{" "}
                <code className="font-mono text-foreground">genre</code>,{" "}
                <code className="font-mono text-foreground">year</code> (1950–2100),{" "}
                <code className="font-mono text-foreground">season</code> (WINTER|SPRING|SUMMER|FALL),{" "}
                <code className="font-mono text-foreground">format</code>{" "}
                (TV|TV_SHORT|MOVIE|SPECIAL|OVA|ONA|MUSIC),{" "}
                <code className="font-mono text-foreground">status</code>{" "}
                (RELEASING|FINISHED|NOT_YET_RELEASED|CANCELLED),{" "}
                <code className="font-mono text-foreground">sort</code>{" "}
                (SEARCH_MATCH|TRENDING_DESC|POPULARITY_DESC|SCORE_DESC|START_DATE_DESC|FAVOURITES_DESC).
              </li>
              <li>
                <code className="font-mono text-foreground">seasonal</code>:{" "}
                <code className="font-mono text-foreground">season</code> and{" "}
                <code className="font-mono text-foreground">year</code> default to the current
                season and year.
              </li>
            </ul>
          </div>
        </Section>

        <Section id="responses" title="Responses">
          <p>
            List endpoints return <code className="font-mono text-foreground">data</code> (an array
            of anime) plus <code className="font-mono text-foreground">pageInfo</code>; the detail
            endpoint returns a single anime under{" "}
            <code className="font-mono text-foreground">data</code>. The anime shape is identical
            everywhere:
          </p>
          <div className="overflow-x-auto rounded-md border border-border/60">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/60 bg-muted/40 text-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Field</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {fields.map(([field, type, note]) => (
                  <tr key={field}>
                    <td className="px-3 py-2 font-mono">{field}</td>
                    <td className="px-3 py-2 font-mono">{type}</td>
                    <td className="px-3 py-2">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Code>{`GET /api/v1/anime/16498

{
  "data": {
    "id": 16498,
    "type": "ANIME",
    "title": { "romaji": "Shingeki no Kyojin", "english": "Attack on Titan", "native": "進撃の巨人" },
    "format": "TV",
    "status": "FINISHED",
    "episodes": 25,
    "duration": 24,
    "season": "SPRING",
    "seasonYear": 2013,
    "startDate": { "year": 2013, "month": 4, "day": 7 },
    "endDate": { "year": 2013, "month": 9, "day": 29 },
    "score": 84,
    "meanScore": 84,
    "popularity": 16800000,
    "favourites": 320000,
    "genres": ["Action", "Drama", "Fantasy"],
    "description": "Centuries ago, mankind was slaughtered to near extinction…",
    "cover": { "extraLarge": "https://s4.anilist.co/…", "large": "https://s4.anilist.co/…", "color": "#e4784c" },
    "banner": "https://s4.anilist.co/…",
    "studios": ["Wit Studio"],
    "nextAiringEpisode": null,
    "isAdult": false
  }
}`}</Code>
          <Code>{`GET /api/v1/anime/trending?perPage=2

{
  "data": [ { "id": 16498, "type": "ANIME", "title": { … }, … } ],
  "pageInfo": { "currentPage": 1, "hasNextPage": true, "total": 500 }
}`}</Code>
        </Section>

        <Section id="errors" title="Errors">
          <p>Errors always use this envelope:</p>
          <Code>{`{
  "error": { "code": "invalid_token", "message": "The provided API token is not valid." }
}`}</Code>
          <div className="overflow-x-auto rounded-md border border-border/60">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/60 bg-muted/40 text-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {errors.map(([code, status, meaning]) => (
                  <tr key={code}>
                    <td className="px-3 py-2 font-mono">{code}</td>
                    <td className="px-3 py-2 font-mono">{status}</td>
                    <td className="px-3 py-2">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        Need a token?{" "}
        <Link href="/account" className="text-sky-500 underline-offset-4 hover:underline">
          Create one on your account page
        </Link>
        .
      </p>
    </div>
  );
}
