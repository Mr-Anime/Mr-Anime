# Mr.Anime API

Public JSON API served by Cloudflare Pages Functions (`functions/`). All anime data comes from the [AniList GraphQL API](https://docs.anilist.co) and is normalized by `functions/lib/map.js`.

- Base URL (production): `https://mranime.cyou`
- Base URL (preview): `https://<deployment>.mr-anime.pages.dev`
- All routes live under `/api/*` and return JSON.
- Authentication: none for public routes. Admin routes require a Supabase access token (see [Admin](#admin)).

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

> **Note:** AniList manually blocks Cloudflare Workers' egress IPs. Production therefore proxies through `ANILIST_ENDPOINT` (see `api/anilist.js` and `README`). If you see `UPSTREAM_BLOCKED`, set that variable to a non-Cloudflare proxy.

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

---

## Non-API routes

| Route           | Description |
|-----------------|-------------|
| `/sitemap.xml`  | Sitemap of static pages + top 500 popular anime. |
| `/robots.txt`   | Crawler rules; disallows `/api/`, `/watchlist`, `/history`, `/profile`, `/admin`, `/reset-password`. |

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
| `/api/admin/stats` | `functions/api/admin/stats.js` |
| `/api/admin/availability` | `functions/api/admin/availability.js` |
| `/sitemap.xml` | `functions/sitemap.xml.js` |
| `/robots.txt` | `functions/robots.txt.js` |
| Shared helpers | `functions/lib/{anilist,map,http,cache,query,supabase}.js` |
