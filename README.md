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
- **Watch** — sandboxed 16:9 provider iframe, provider switcher, TMDB episode
  titles/stills (`?s=` for later seasons), prev/next, `TVEpisode` JSON-LD, report-broken-video.
- **Auth** — email/password register, login, forgot/reset password, optional Google OAuth,
  ban handling (`/suspended`), account management (username/avatar/password).
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
2. Apply `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_comments.sql`, then `supabase/migrations/0003_user_list.sql`
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
# template style — tokens: {id} {ep} {title} {tmdb} {season}
PROVIDER_1_BASE=https://your-legal-embed-provider.example/e/{id}/{ep}
PROVIDER_1_NAME=Provider 1
# plain base → ?id=…&ep=…&season=…&tmdb=… is appended
PROVIDER_2_BASE=https://another-provider.example/embed
PROVIDER_2_NAME=Provider 2
```

Origins are added to the CSP `frame-src` automatically by `next.config.ts`.

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
| `ENABLE_GOOGLE_OAUTH` | server | `1` = show Google sign-in |
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
  components/          ui (shadcn), anime, auth, admin, search, watch
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
