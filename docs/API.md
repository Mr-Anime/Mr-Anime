# Mr.Anime API

Public JSON API served by Cloudflare Pages Functions (`functions/`). All anime data comes from the [AniList GraphQL API](https://docs.anilist.co) and is normalized by `functions/lib/map.js`.

- Base URL (production): `https://mranime.cyou`
- Base URL (preview): `https://<deployment>.mr-anime.pages.dev`
- All routes live under `/api/*` and return JSON.
- Authentication: none for public routes. The player API accepts same-origin calls or a bearer API token from `/developer`. Admin routes require a Supabase access token (see [Admin](#admin)).

---

## Conventions

### Card object

Used by grids, rows, batch results and recommendations.

```json
{
  "id": 16498,
  "title": { "english": "Attack on Titan", "romaji": "Shingeki no Kyojin", "native": "進撃の巨人", "userPreferred": "Shingeki no Kyojin" },
  "coverImage": { "extraLarge": "https://.../bx16498.jpg", "large": "https://.../bx16498.jpg", "color": "#e49335" },
  "bannerImage": "https://.../banner.jpg",
  "format": "TV",
  "seasonYear": 2013,
  "status": "FINISHED",
  "episodes": 25,
  "nextAiringEpisode": null,
  "averageScore": 85,
  "genres": ["Action", "Drama"],
  "description": "<p>Several hundred years ago...</p>"
}
```

`nextAiringEpisode`, when present, is `{ "episode": 1181, "airingAt": 1798985760, "timeUntilAiring": 4515078 }` (unix seconds).

### Errors

Every error uses the same envelope:

```json
{ "error": "Human readable message.", "code": "ERROR_CODE" }
```

| HTTP | `code`            | Meaning                                                   |
|------|-------------------|-----------------------------------------------------------|
| 400  | `BAD_REQUEST`     | Invalid query parameters or body.                         |
| 404  | `NOT_FOUND`       | Anime id not found on AniList.                            |
| 405  | `BAD_REQUEST`     | Method not allowed (see `Allow` header).                  |
| 401  | `UNAUTHORIZED`    | Admin route: missing or invalid token.                    |
| 403  | `FORBIDDEN`       | Admin route: signed in but not an admin.                  |
| 429  | `RATE_LIMITED`    | Upstream (AniList) rate limit; retry after `Retry-After`. |
| 502  | `UPSTREAM_ERROR`  | AniList or Supabase returned an error.                    |
| 502  | `UPSTREAM_BLOCKED`| AniList blocks this server's IP (see note below).         |
| 504  | `TIMEOUT`         | Upstream request timed out.                               |
| 500  | `INTERNAL`        | Unexpected server error.                                  |

> **Note:** AniList manually blocks Cloudflare Workers' egress IPs. Production therefore proxies through `ANILIST_ENDPOINT` (see below). If you see `UPSTREAM_BLOCKED`, set that variable to a non-Cloudflare proxy.

### AniList proxy (required in production)

Both `api/anilist.js` (Vercel) and `netlify/functions/anilist.mjs` (Netlify) expose the same contract:

```http
POST /api/anilist
Content-Type: application/json

{ "query": "query { Media(id: 16498, type: ANIME) { id } }", "variables": {} }
```

The response is AniList's response passed through with its original status code.

Health probe — open this in a browser after deploying:

```http
GET /api/anilist?check=1
```

```json
{ "ok": true, "status": 200, "latencyMs": 123 }
```

`ok: false` returns `502 UPSTREAM_ERROR` (AniList rejected the request) or `504 TIMEOUT` (network failure / 9 s timeout).

Deploy either one, then set the Cloudflare Pages variable:

```bash
# Vercel
ANILIST_ENDPOINT=https://<project>.vercel.app/api/anilist
# Netlify
ANILIST_ENDPOINT=https://<site>.netlify.app/api/anilist
```

### Caching

Responses are cached at the edge in KV (`MRANIME_CACHE`):

| Route            | TTL    |
|------------------|--------|
| `/api/trending`  | 1800 s (`TRENDING_TTL_SECONDS`) |
| `/api/search`    | 300 s (3600 s for suggestions)  |
| `/api/schedule`  | 900 s  |
| `/api/availability/:id` | not cached (DB lookup) |

---

## Endpoints

### `GET /api/trending`

Top trending anime (10 cards).

```http
GET /api/trending
```

```json
{ "data": [ /* Card[] */ ] }
```

### `GET /api/trending?rows=1`

Home page rows. Each row contains up to 14 cards for the current season.

```http
GET /api/trending?rows=1
```

```json
{
  "rows": {
    "trending":        { "data": [ /* Card[] */ ] },
    "popularSeason":   { "data": [ /* Card[] */ ] },
    "topRated":        { "data": [ /* Card[] */ ] },
    "recentlyUpdated": { "data": [ /* Card[] */ ] },
    "upcoming":        { "data": [ /* Card[] */ ] }
  }
}
```

### `GET /api/anime/:id`

Full details for one anime.

```http
GET /api/anime/16498
```

Path param `id` must be a number (`/^\d{1,10}$/`).

Returns `{ "data": Media }` where `Media` extends the Card object:

```json
{
  "data": {
    "...": "all Card fields",
    "meanScore": 85,
    "popularity": 510000,
    "favourites": 120000,
    "duration": 24,
    "season": "SPRING",
    "source": "MANGA",
    "startDate": { "year": 2013, "month": 4, "day": 7 },
    "endDate": { "year": 2013, "month": 9, "day": 29 },
    "studios": { "nodes": [{ "name": "Wit Studio" }] },
    "trailer": { "id": "abc123", "site": "youtube", "thumbnail": "https://..." },
    "tags": [{ "name": "Military", "rank": 90 }],
    "characters": {
      "edges": [{
        "role": "MAIN",
        "node": { "id": 40882, "name": { "full": "Eren Yeager" }, "image": { "medium": "https://..." } },
        "voiceActors": [{ "id": 95531, "name": { "full": "Yuki Kaji" }, "language": "Japanese" }]
      }]
    },
    "relations": {
      "edges": [{
        "relationType": "SEQUEL",
        "node": { "id": 20665, "type": "ANIME", "title": { "romaji": "..." }, "coverImage": { "large": "https://..." }, "format": "TV", "episodes": 25, "status": "FINISHED" }
      }]
    },
    "recommendations": { "nodes": [ /* Card[] */ ] },
    "externalLinks": [{ "id": 1, "site": "Crunchyroll", "url": "https://...", "type": "STREAMING" }]
  }
}
```

### `GET /api/anime/batch?ids=…`

Fetch many cards at once (max 50 ids). Missing ids are omitted; order follows the request.

```http
GET /api/anime/batch?ids=16498,21,5114
```

```json
{ "data": [ /* Card[] */ ] }
```

### `GET /api/search`

Paged search / browse. All filters optional.

```http
GET /api/search?q=naruto&page=1&perPage=24&sort=POPULARITY_DESC&genre=Action,Drama&format=TV&season=FALL&year=2024&status=RELEASING
```

| Param      | Type               | Notes |
|------------|--------------------|-------|
| `q`        | string             | Min 2 chars (trimmed, max 100). |
| `page`     | int (1–500)        | Default `1`. |
| `perPage`  | int (1–50)         | Default `24` (`8` for suggestions). |
| `sort`     | enum               | `TRENDING_DESC`, `POPULARITY_DESC`, `SCORE_DESC`, `FAVOURITES_DESC`, `START_DATE_DESC`, `UPDATED_AT_DESC`, `TITLE_ROMAJI`, `TITLE_ENGLISH`. Default `POPULARITY_DESC`. |
| `genre`    | comma-separated    | `Action`, `Adventure`, `Comedy`, `Drama`, `Ecchi`, `Fantasy`, `Horror`, `Mahou Shoujo`, `Mecha`, `Music`, `Mystery`, `Psychological`, `Romance`, `Sci-Fi`, `Slice of Life`, `Sports`, `Supernatural`, `Thriller`. |
| `format`   | enum               | `TV`, `TV_SHORT`, `MOVIE`, `SPECIAL`, `OVA`, `ONA`, `MUSIC`. |
| `season`   | enum               | `WINTER`, `SPRING`, `SUMMER`, `FALL`. |
| `year`     | int (1940–2100)    | Alias: `seasonYear`. |
| `status`   | enum               | `FINISHED`, `RELEASING`, `NOT_YET_RELEASED`, `CANCELLED`, `HIATUS`. |

Response:

```json
{
  "pageInfo": { "total": 5000, "currentPage": 1, "lastPage": 2500, "hasNextPage": true, "perPage": 24 },
  "media": [ /* Media[] (same shape as /api/anime/:id .data) */ ]
}
```

#### Suggestions mode

```http
GET /api/search?q=fri&suggestions=1&perPage=6
```

Returns lightweight items (max 10), sorted by `SEARCH_MATCH`:

```json
{ "data": [ { "id": 154587, "title": { /* … */ }, "coverImage": { /* … */ }, "format": "TV", "seasonYear": 2023, "averageScore": 91 } ] }
```

### `GET /api/schedule?offset=0`

Airing schedule for the next 7 days from today (UTC). `offset` (0–6) shifts the start day.

```http
GET /api/schedule?offset=0
```

```json
{
  "airingSchedules": [
    {
      "id": 217624,
      "airingAt": 1794475800,
      "episode": 7,
      "media": {
        "id": 217624,
        "title": { "english": null, "romaji": "…", "native": "…", "userPreferred": "…" },
        "coverImage": { "extraLarge": "…", "large": "…", "color": "#…" },
        "format": "TV",
        "episodes": 12,
        "nextAiringEpisode": { "episode": 8, "airingAt": 1795080600, "timeUntilAiring": 604800 }
      }
    }
  ],
  "range": { "from": 1794441600, "to": 1795046400 }
}
```

### `GET /api/availability/:id`

Sub/dub availability for an anime. Falls back to defaults when no override exists.

```http
GET /api/availability/16498
```

```json
{
  "data": {
    "anilistId": 16498,
    "hasSub": true,
    "hasDub": true,
    "subEpisodes": null,
    "dubEpisodes": null,
    "override": false
  }
}
```

---

## Player

### `GET /api/player/:anilistId/:episode?lang=sub|dub`

Returns the streaming servers for one episode. Videos are never hosted here: each server is a third-party embed URL built server-side from `src/config/providers.js`.

```http
GET /api/player/16498/1?lang=sub
```

```json
{
  "data": {
    "anilistId": 16498,
    "episode": 1,
    "lang": "sub",
    "episodeAllowed": true,
    "servers": [
      { "id": "megaplay", "name": "MegaPlay", "url": "https://…" }
    ],
    "availability": { "hasSub": true, "hasDub": true, "subEpisodes": null, "dubEpisodes": null, "override": false }
  }
}
```

`episodeAllowed` is `false` and `servers` is empty when the language is disabled or the episode cap is exceeded. Responses are cached for 5 minutes.

**Authentication:** requests from the Mr.Anime site itself (same origin) are allowed. External callers must send a personal API token or an OAuth access token:

```http
Authorization: Bearer mra_…
Authorization: Bearer mrao_…
```

### Developer tokens

Tokens are created at `/developer` (signed-in users) and stored hashed (SHA-256) in `public.api_tokens`:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dev/tokens` | List your active tokens (prefix only). |
| `POST` | `/api/dev/tokens` | Create a token — `{ "name": "My bot" }`. The raw token is returned once. |
| `DELETE` | `/api/dev/tokens?id=…` | Revoke a token immediately. |

All three require the Supabase access token of the signed-in user as a bearer header.

### OAuth 2.0 (developer apps)

Signed-in users can register apps at `/developer` and use the standard authorization-code flow. PKCE (`S256`) is supported and recommended for public clients; confidential clients may authenticate with `client_id` + `client_secret` instead. OAuth access tokens (`mrao_…`) are accepted anywhere a personal token is and are stored hashed (SHA-256) in `public.oauth_tokens`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/oauth/apps` | List your OAuth apps. |
| `POST` | `/api/oauth/apps` | Register an app — `{ "name": "My bot", "redirectUris": ["https://…/callback"] }`. The `clientSecret` is returned once. |
| `DELETE` | `/api/oauth/apps?id=…` | Revoke an app and all of its tokens. |
| `GET` | `/api/oauth/authorize` | Validate an authorization request and describe the app (public). |
| `POST` | `/api/oauth/authorize` | Approve the request (signed-in user); returns `{ "redirectTo": "https://…?code=…&state=…" }`. |
| `POST` | `/api/oauth/token` | Exchange an authorization code or refresh token. |
| `GET` | `/api/oauth/userinfo` | Profile of the user who authorized the token. |
| `POST` | `/api/oauth/revoke` | Revoke an access or refresh token (RFC 7009). |

The `/api/oauth/apps` and `POST /api/oauth/authorize` calls require the Supabase access token of the signed-in user. `/api/oauth/token` and `/api/oauth/revoke` authenticate the app with HTTP Basic auth or `client_id`/`client_secret` body fields (public clients with PKCE may omit the secret at exchange).

**Flow**

1. Send the user's browser to the consent page on the site (not the API):

```http
GET /oauth/authorize?client_id=<client-id>&redirect_uri=<uri>&response_type=code&scope=read&state=xyz&code_challenge=<S256>&code_challenge_method=S256
```

2. After approval the browser returns to `redirect_uri` with `code` and `state` (or `error=access_denied`).

3. Exchange the code:

```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=<code>&redirect_uri=<uri>&client_id=<client-id>&code_verifier=<verifier>
```

```json
{
  "access_token": "mrao_…",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "mrar_…",
  "scope": "read"
}
```

4. Call the player API with `Authorization: Bearer mrao_…`, or fetch the authorizing user from `/api/oauth/userinfo`:

```json
{ "sub": "uuid", "username": "animefan", "avatar_url": "https://…", "verified": false, "scope": "read" }
```

Authorization codes are single-use and expire after 10 minutes. Access tokens live 24 hours; refresh tokens live 90 days and rotate on every use (`grant_type=refresh_token`). Token errors use the OAuth envelope `{ "error": "invalid_grant", "error_description": "…" }`.

---

## Admin

Admin routes require a Supabase access token:

```http
Authorization: Bearer <supabase-access-token>
```

The token's user must have `role = 'admin'` in the `profiles` table. Otherwise `401 UNAUTHORIZED` / `403 FORBIDDEN`.

### `GET /api/admin/stats`

```json
{ "users": 12, "watchlistEntries": 40, "historyEntries": 300, "cachedShows": 6, "cacheOverrides": 2 }
```

### `GET /api/admin/availability`

List availability overrides (most recently updated first, max 500).

```json
{
  "data": [
    { "anilistId": 16498, "hasSub": true, "hasDub": false, "subEpisodes": 25, "dubEpisodes": null, "updatedAt": "2026-11-10T12:00:00Z", "updatedBy": "uuid" }
  ]
}
```

### `POST /api/admin/availability` (or `PUT`)

Upsert an override by `anilistId`.

```http
POST /api/admin/availability
Content-Type: application/json

{ "anilistId": 16498, "hasSub": true, "hasDub": false, "subEpisodes": 25, "dubEpisodes": null }
```

| Field          | Required | Notes |
|----------------|----------|-------|
| `anilistId`    | yes      | Positive integer. |
| `hasSub`       | no       | Boolean, default `false`. |
| `hasDub`       | no       | Boolean, default `false`. |
| `subEpisodes`  | no       | Non-negative integer or `null`. |
| `dubEpisodes`  | no       | Non-negative integer or `null`. |

Returns the saved row in the same shape as the list above.

### `DELETE /api/admin/availability?anilistId=…`

```json
{ "data": { "anilistId": 16498, "deleted": true } }
```

### `GET /api/admin/smtp`

Current Supabase Auth SMTP settings (used for password reset, confirmation and magic-link emails). The password is never returned. `source` is `supabase`, `environment` or `none`; `editable` is `false` when the values come from environment variables and no management token is available.

```json
{
  "data": {
    "host": "smtp.example.com",
    "port": 587,
    "user": "smtp-user",
    "senderEmail": "noreply@mranime.cyou",
    "senderName": "Mr.Anime",
    "configured": true,
    "source": "supabase",
    "editable": true
  }
}
```

If the project has no SMTP config but `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SENDER_EMAIL` and `SMTP_SENDER_NAME` are set on the Pages deployment, they are applied to the project automatically (when `SUPABASE_ACCESS_TOKEN` exists) and reported as `source: "environment"`.

### `PUT /api/admin/smtp`

```http
PUT /api/admin/smtp
Content-Type: application/json

{ "host": "smtp.example.com", "port": 587, "user": "smtp-user", "pass": "secret", "senderEmail": "noreply@mranime.cyou", "senderName": "Mr.Anime" }
```

Saves through the Supabase Management API, so the Pages project needs the server secret `SUPABASE_ACCESS_TOKEN` plus the `SUPABASE_PROJECT_ID` var. Omit `pass` to keep the stored password.

### `GET /api/admin/users?q=username`

Search profiles by username (min 2 characters, max 20 results).

```json
{ "data": [ { "id": "uuid", "username": "sakura", "role": "user", "verified": true } ] }
```

### `PUT /api/admin/users`

Toggle a user's verified badge. The badge is snapshotted onto their comments (`author_verified`) so it renders next to their name.

```http
PUT /api/admin/users
Content-Type: application/json

{ "userId": "uuid", "verified": true }
```

Admins are always returned as `verified: true`.

---

## Comments

Comments are read and written directly against Supabase (`public.comments`) with RLS, not through `/api`. Anime-level comments use `episode = NULL`; episode comments set `episode` to the episode number. Visible comments are readable by everyone, authors can delete their own, and admins can hide/restore or delete any comment.

---

## Non-API routes

| Route           | Description |
|-----------------|-------------|
| `/sitemap.xml`  | Sitemap of static pages + top 500 popular anime, using the `/info/{id}/{slug}` URLs. |
| `/robots.txt`   | Crawler rules; disallows `/api/`, `/watchlist`, `/history`, `/profile`, `/admin`, `/developer`, `/oauth/`, `/reset-password`. |

### App routes

| Route | Page |
|-------|------|
| `/info/:anilistId/:animeSlug?` | Anime details (`/info/16498/attack-on-titan`). The slug is cosmetic — the AniList id is authoritative. |
| `/player/:animeSlug/:episode?lang=sub\|dub` | Player. The slug ends with `-{anilistId}` (e.g. `/player/attack-on-titan-16498/1?lang=sub`) so the id can be recovered without a lookup. |
| `/developer` | Create and revoke personal API tokens and OAuth apps (signed-in users). |
| `/oauth/authorize` | OAuth consent screen (`client_id`, `redirect_uri`, `response_type`, `scope`, `state`, PKCE params). |

---

## Source map

| Route | File |
|-------|------|
| `/api/trending` | `functions/api/trending.js` |
| `/api/anime/:id` | `functions/api/anime/[id].js` |
| `/api/anime/batch` | `functions/api/anime/batch.js` |
| `/api/search` | `functions/api/search.js` |
| `/api/schedule` | `functions/api/schedule.js` |
| `/api/availability/:id` | `functions/api/availability/[id].js` |
| `/api/player/:anilistId/:episode` | `functions/api/player/[anilistId]/[episode].js` |
| `/api/dev/tokens` | `functions/api/dev/tokens.js` |
| `/api/oauth/apps` | `functions/api/oauth/apps.js` |
| `/api/oauth/authorize` | `functions/api/oauth/authorize.js` |
| `/api/oauth/token` | `functions/api/oauth/token.js` |
| `/api/oauth/revoke` | `functions/api/oauth/revoke.js` |
| `/api/oauth/userinfo` | `functions/api/oauth/userinfo.js` |
| `/api/admin/stats` | `functions/api/admin/stats.js` |
| `/api/admin/availability` | `functions/api/admin/availability.js` |
| `/api/admin/smtp` | `functions/api/admin/smtp.js` |
| `/api/admin/users` | `functions/api/admin/users.js` |
| `/sitemap.xml` | `functions/sitemap.xml.js` |
| `/robots.txt` | `functions/robots.txt.js` |
| `/api/anilist` (proxy) | `api/anilist.js` (Vercel) / `netlify/functions/anilist.mjs` (Netlify) |
| Shared helpers | `functions/lib/{anilist,map,http,cache,query,supabase,tokens,oauth}.js` |
