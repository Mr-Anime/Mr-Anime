# Mr.Anime

Production-grade anime streaming web app for **Bazil (Biytri Technology)**.
Browse the AniList catalogue, read full details, and watch episodes through
env-configured embed providers — with user accounts, an admin panel and a full
audit trail.

**Core rule: no anime data lives in the database.** All metadata is fetched
live from [AniList](https://anilist.co) GraphQL + [TMDB](https://www.themoviedb.org) v3
through our own Next.js route handlers (with layered caching). Supabase stores
**users only** (profiles + audit log).

---

## Stack

| Layer      | Choice                                                          |
| ---------- | --------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack, `proxy.ts` middleware)        |
| Language   | TypeScript strict                                                |
| Styling    | Tailwind v4 + shadcn/ui (Base UI primitives)                     |
| Data       | TanStack Query (client), Zod (validation)                        |
| Auth / DB  | Supabase (SSR cookies, RLS, service role server-side only)       |
| Metadata   | AniList GraphQL (primary) + TMDB v3 (backdrops/trailers/stills)  |
| Deploy     | Vercel                                                           |

## Features

- **Home** — hero banner, Trending / Seasonal / Top rated / Popular rows, genre chips, JSON-LD.
- **Search** — URL-driven filters (genre, year, season, format, status, sort), debounce, pagination.
- **Details** — sanitized synopsis, trailer (AniList → TMDB fallback), episode grid,
  characters, relations, recommendations, `TVSeries` JSON-LD, OG/Twitter cards.
- **Watch** — provider iframe, Sub/Dub toggle with dub availability probing,
  TMDB episode titles/stills (`?s=` for later seasons), prev/next, `TVEpisode`
  JSON-LD, report-broken-video.
- **My List** — MyAnimeList-style status + episode progress per title, with
  "mark watched" buttons on the player.
- **Comments & profiles** — episode comments, public profile pages
  (`/profile/{username}`) linked from comment authors.
- **Shop** — earn **Mr.Coin** while watching (random drops, 10-min cooldown,
  occasional ×3 jackpot), spend it on avatar frames, name styles and name
  animations that show on comments, hover cards and profiles; equip UI on
  `/shop`, balances + purchases in `wallets`/`user_items` via SQL RPCs.
- **Auth** — email/password register, login, forgot/reset password, optional OAuth
  login (Google, GitHub, Discord),
  ban handling (`/suspended`), account management (username/avatar/password).
- **Public REST API** — token-authenticated `/api/v1` endpoints (search,
  trending, seasonal, details) with docs at `/docs/api`.
- **OAuth 2.0 provider** — third-party apps get `client_id`/`client_secret` on
  `/account`; authorization_code (“Sign in with Mr.Anime”) + client_credentials
  grants, scopes, consent screen at `/oauth/authorize`.
- **Admin** — dashboard, user management (ban, promote/demote, verify, delete) with
  last-admin and self-action guards, append-only audit log (`admin_actions`).
- **SEO** — sitemap (trending titles), robots, manifest, canonicals, per-page metadata.
- **Security** — CSP with env-driven `frame-src`, RLS + column-level grants, rate limits
  (report endpoint, auth actions), HTML sanitization, server-only secrets.

## Quick start

```bash
npm install
cp .env.example .env.local    # then fill in the values
npm run dev                   # http://localhost:3000
```

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Apply `supabase/migrations/0001_init.sql`, then `0002_comments.sql`, `0003_user_list.sql`,
   `0004_api_tokens.sql`, `0005_oauth.sql`, `0006_shop.sql`
   (SQL editor, or `supabase db push` with the CLI).
3. Copy **Project URL**, **anon/publishable key** and **service role key** into `.env.local`.
4. Sign up through the app, then promote yourself (commented SQL at the bottom
   of the migration):

```sql
update public.profiles set role = 'admin', is_verified = true
where username = 'your_name';
```

### 2. TMDB (optional)

Get an **API Read Access Token** from
[themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) →
`TMDB_READ_ACCESS_TOKEN`. Without it the app still works; trailers/episode
still enrichment is simply skipped (API routes return 503).

### 3. Providers (optional for browsing)

Providers are **never hard-coded**. In `.env.local`:

```bash
# template style — tokens: {id} {ep} {title} {tmdb} {season} {lang}
PROVIDER_1_BASE=https://your-legal-embed-provider.example/e/{id}/{ep}
PROVIDER_1_NAME=Provider 1
# plain base → ?id=…&ep=…&season=…&tmdb=… is appended
PROVIDER_2_BASE=https://another-provider.example/embed
PROVIDER_2_NAME=Provider 2
# subtitles-only provider (no dub): Dub is disabled for it
PROVIDER_3_SUBONLY=1
```

Origins are added to the CSP `frame-src` automatically by `next.config.ts`.
A template using `{tmdb}` (e.g. VidRift's `/embed/tv/{tmdb}/{season}/{ep}`)
is skipped for titles without a TMDB id.

## Public API

Base URL: `https://mr-anime.vercel.app/api/v1` — docs at [`/docs/api`](/docs/api).

| Endpoint | Purpose |
| --- | --- |
| `GET /anime/trending\|popular\|top?page=&perPage=` | curated lists |
| `GET /anime/seasonal?season=&year=` | browse a season (defaults to now) |
| `GET /anime/search?q=&genre=&year=&status=…` | search + filters |
| `GET /anime/{id}` | single-title details |
| `GET /anime/{id}/episodes?season=` | episode list (titles + thumbnails) |
| `GET /anime/{id}/episodes/{ep}?lang=&season=` | player payload: metadata, episode meta, embed URLs, dub flags |
| `GET /me` | token's user id/username/avatar/badges (`profile` scope or personal token) |

- **Auth:** create a token on `/account` (API tokens card), then send
  `Authorization: Bearer ma_live_…` (`X-API-Key` also accepted). Only a
  SHA-256 hash is stored (`api_tokens` table, migration `0004`).
- **OAuth apps:** register on `/account` (OAuth applications card, migration
  `0005`), then `GET /oauth/authorize?client_id=…&redirect_uri=…&response_type=code&scope=read%20profile&state=…`
  → `POST /oauth/token` (grants `authorization_code` | `client_credentials`)
  → use the returned `ma_at_…` token as a normal bearer. Full flow in
  [`/docs/api`](/docs/api#oauth).
- **Rate limit:** 60 requests/minute per token; `429` + `Retry-After` beyond.
- Responses are CDN-cached; CORS is open for browser clients.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | server+client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | server+client | anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | admin panel / privileged writes |
| `TMDB_READ_ACCESS_TOKEN` | **server only** | TMDB enrichment |
| `PROVIDER_N_BASE` / `PROVIDER_N_NAME` | server | embed providers (N = 1…6) |
| `NEXT_PUBLIC_SITE_URL` | server | canonical origin (OG, sitemap) |
| `REQUIRE_LOGIN_TO_WATCH` | server | `1` = `/watch` requires login |
| `ENABLE_GOOGLE_OAUTH` / `ENABLE_GITHUB_OAUTH` / `ENABLE_DISCORD_OAUTH` | server | `1` = show that OAuth sign-in button |
| `REPORT_WEBHOOK_URL` | server | forward broken-video reports |

Local dev without Supabase credentials is tolerated: auth pages render,
admin shows a configuration notice, and the proxy logs a warning and skips
route protection.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build (verified passing)
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## Project structure

```
src/
  app/                 routes (pages, api proxies, actions)
    actions/           server actions (auth, account, admin)
    admin/             gated admin panel
    anime/[id]/        details page
    watch/[id]/[ep]/   player page
    api/anime|tmdb/    cached upstream proxies
    api/v1/            public token-authenticated REST API
    docs/api/          API documentation page
  components/          ui (shadcn), anime, auth, admin, search, watch, account
  config/providers.ts  env-only provider registry + buildUrl()
  lib/                 anilist, tmdb, supabase clients, cache, rate limit, sanitize
  proxy.ts             Next 16 middleware (session refresh + route guards)
supabase/migrations/   schema, RLS, column grants, triggers
```

## Deployment (Vercel)

1. Push the repo and import it in Vercel.
2. Add all env vars above (use Vercel environment variables; keep service-role
   and TMDB tokens **server-only**).
3. Deploy — `next build` runs automatically. No extra config needed.
4. After first deploy: sign up, promote yourself to admin (SQL above).

## Notes

- AniList rate limit is 30 req/min — the client retries on 429 with backoff
  and caches responses (trending 1h, details 6h, search 10m).
- Playback embeds are third-party; operators must ensure their providers are
  licensed for the content. Mr.Anime itself hosts no video files.
- Attribution (required): *Data from AniList and TMDB. This product uses the
  TMDB API but is not endorsed or certified by TMDB.*

---

© Bazil (Biytri Technology)
