import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Container from '../components/ui/Container.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Icon from '../components/ui/Icon.jsx';
import Prose from '../components/ui/Prose.jsx';
import { useDocumentMeta } from '../lib/meta.js';
import { useToast } from '../context/ToastContext.jsx';

const ERRORS = [
  ['400', 'BAD_REQUEST', 'Invalid query parameters or body.'],
  ['401', 'UNAUTHORIZED', 'Admin route: missing or invalid token.'],
  ['403', 'FORBIDDEN', 'Admin route: signed in but not an admin.'],
  ['404', 'NOT_FOUND', 'Anime id not found on AniList.'],
  ['405', 'BAD_REQUEST', 'Method not allowed (see Allow header).'],
  ['429', 'RATE_LIMITED', 'AniList rate limit; retry after Retry-After.'],
  ['502', 'UPSTREAM_ERROR', 'AniList or Supabase returned an error.'],
  ['502', 'UPSTREAM_BLOCKED', 'AniList is blocking this server.'],
  ['504', 'TIMEOUT', 'Upstream request timed out.'],
  ['500', 'INTERNAL', 'Unexpected server error.'],
];

const CARD_EXAMPLE = `{
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
}`;

const ENDPOINTS = [
  {
    id: 'trending',
    method: 'GET',
    path: '/api/trending',
    title: 'Trending',
    summary: 'Top 10 trending anime, or the five home-page rows with ?rows=1.',
    variants: [
      { label: 'Top 10', query: '', response: `{ "data": [ /* Card[] */ ] }` },
      {
        label: 'Home rows',
        query: '?rows=1',
        response: `{
  "rows": {
    "trending":        { "data": [ /* Card[] */ ] },
    "popularSeason":   { "data": [ /* Card[] */ ] },
    "topRated":        { "data": [ /* Card[] */ ] },
    "recentlyUpdated": { "data": [ /* Card[] */ ] },
    "upcoming":        { "data": [ /* Card[] */ ] }
  }
}`,
      },
    ],
  },
  {
    id: 'anime',
    method: 'GET',
    path: '/api/anime/:id',
    title: 'Anime details',
    summary: 'Full details for one anime. Extends the Card object with studios, characters, relations and recommendations.',
    variants: [
      {
        label: 'Example',
        query: '',
        pathOverride: '/api/anime/16498',
        response: `{
  "data": {
    "...": "all Card fields",
    "meanScore": 85,
    "popularity": 510000,
    "season": "SPRING",
    "startDate": { "year": 2013, "month": 4, "day": 7 },
    "studios": { "nodes": [{ "name": "Wit Studio" }] },
    "tags": [{ "name": "Military", "rank": 90 }],
    "characters": { "edges": [ /* { role, node, voiceActors } */ ] },
    "relations": { "edges": [ /* { relationType, node } */ ] },
    "recommendations": { "nodes": [ /* Card[] */ ] },
    "externalLinks": [{ "id": 1, "site": "Crunchyroll", "url": "https://...", "type": "STREAMING" }]
  }
}`,
      },
    ],
  },
  {
    id: 'batch',
    method: 'GET',
    path: '/api/anime/batch?ids=16498,21',
    title: 'Batch',
    summary: 'Fetch many cards at once (max 50 ids). Missing ids are omitted; order follows the request.',
    variants: [{ label: 'Example', query: '', response: `{ "data": [ /* Card[] */ ] }` }],
  },
  {
    id: 'search',
    method: 'GET',
    path: '/api/search',
    title: 'Search & browse',
    summary: 'Paged search with optional filters. All parameters are optional.',
    params: [
      ['q', 'string', 'Min 2 chars (trimmed, max 100).'],
      ['page', 'int 1–500', 'Default 1.'],
      ['perPage', 'int 1–50', 'Default 24 (8 for suggestions).'],
      ['sort', 'enum', 'TRENDING_DESC, POPULARITY_DESC, SCORE_DESC, FAVOURITES_DESC, START_DATE_DESC, UPDATED_AT_DESC, TITLE_ROMAJI, TITLE_ENGLISH. Default POPULARITY_DESC.'],
      ['genre', 'csv', 'Action, Adventure, Comedy, Drama, Ecchi, Fantasy, Horror, Mahou Shoujo, Mecha, Music, Mystery, Psychological, Romance, Sci-Fi, Slice of Life, Sports, Supernatural, Thriller.'],
      ['format', 'enum', 'TV, TV_SHORT, MOVIE, SPECIAL, OVA, ONA, MUSIC.'],
      ['season', 'enum', 'WINTER, SPRING, SUMMER, FALL.'],
      ['year', 'int 1940–2100', 'Alias: seasonYear.'],
      ['status', 'enum', 'FINISHED, RELEASING, NOT_YET_RELEASED, CANCELLED, HIATUS.'],
    ],
    variants: [
      {
        label: 'Search',
        query: '?q=naruto&perPage=2',
        response: `{
  "pageInfo": { "total": 5000, "currentPage": 1, "lastPage": 2500, "hasNextPage": true, "perPage": 2 },
  "media": [ /* Media[] */ ]
}`,
      },
      {
        label: 'Suggestions',
        query: '?q=fri&suggestions=1&perPage=6',
        response: `{ "data": [ { "id": 154587, "title": { /* … */ }, "coverImage": { /* … */ }, "format": "TV", "seasonYear": 2023, "averageScore": 91 } ] }`,
      },
    ],
  },
  {
    id: 'schedule',
    method: 'GET',
    path: '/api/schedule?offset=0',
    title: 'Schedule',
    summary: 'Airing schedule for the next 7 days (UTC). offset (0–6) shifts the start day.',
    variants: [
      {
        label: 'Example',
        query: '',
        response: `{
  "airingSchedules": [
    {
      "id": 217624,
      "airingAt": 1794475800,
      "episode": 7,
      "media": {
        "id": 217624,
        "title": { /* … */ },
        "coverImage": { /* … */ },
        "format": "TV",
        "episodes": 12,
        "nextAiringEpisode": { "episode": 8, "airingAt": 1795080600, "timeUntilAiring": 604800 }
      }
    }
  ],
  "range": { "from": 1794441600, "to": 1795046400 }
}`,
      },
    ],
  },
  {
    id: 'availability',
    method: 'GET',
    path: '/api/availability/:id',
    title: 'Availability',
    summary: 'Sub/dub availability for an anime. Falls back to defaults when no override exists.',
    variants: [
      {
        label: 'Example',
        query: '',
        pathOverride: '/api/availability/16498',
        response: `{ "data": { "anilistId": 16498, "hasSub": true, "hasDub": true, "subEpisodes": null, "dubEpisodes": null, "override": false } }`,
      },
    ],
  },
  {
    id: 'player',
    method: 'GET',
    path: '/api/player/:anilistId/:episode',
    title: 'Player servers',
    summary: 'Streaming servers for one episode (third-party embed URLs, filtered by availability). Same-origin requests from Mr.Anime are allowed; outside callers need an API token from /developer.',
    auth: true,
    authLabel: 'Token',
    variants: [
      {
        label: 'Example',
        query: '?lang=sub',
        pathOverride: '/api/player/16498/1',
        response: `{
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
}`,
      },
    ],
  },
  {
    id: 'admin',
    method: 'GET',
    path: '/api/admin/*',
    title: 'Admin',
    summary: 'Requires "Authorization: Bearer <supabase-access-token>" for a user with role = admin in profiles.',
    auth: true,
    variants: [
      {
        label: 'Stats',
        pathOverride: '/api/admin/stats',
        query: '',
        response: `{ "users": 12, "watchlistEntries": 40, "historyEntries": 300, "cachedShows": 6, "cacheOverrides": 2 }`,
      },
      {
        label: 'List overrides',
        pathOverride: '/api/admin/availability',
        query: '',
        response: `{ "data": [ { "anilistId": 16498, "hasSub": true, "hasDub": false, "subEpisodes": 25, "dubEpisodes": null, "updatedAt": "2026-11-10T12:00:00Z", "updatedBy": "uuid" } ] }`,
      },
      {
        label: 'Save override (POST / PUT)',
        pathOverride: '/api/admin/availability',
        query: '',
        body: `{ "anilistId": 16498, "hasSub": true, "hasDub": false, "subEpisodes": 25, "dubEpisodes": null }`,
        response: `{ "data": { "anilistId": 16498, "hasSub": true, "hasDub": false, "subEpisodes": 25, "dubEpisodes": null, "updatedAt": "…", "updatedBy": "uuid" } }`,
      },
      {
        label: 'Delete (DELETE)',
        pathOverride: '/api/admin/availability',
        query: '?anilistId=16498',
        response: `{ "data": { "anilistId": 16498, "deleted": true } }`,
      },
    ],
  },
];

const METHOD_STYLES = {
  GET: 'bg-emerald-500/15 text-emerald-300',
  POST: 'bg-brand/15 text-brand',
  PUT: 'bg-amber-500/15 text-amber-300',
  DELETE: 'bg-red-500/15 text-red-300',
};

function CodeBlock({ label, code }) {
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy');
    }
  };
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
        <button type="button" onClick={copy} className="rounded px-1.5 py-0.5 text-[11px] text-zinc-400 hover:bg-white/5 hover:text-white">
          Copy
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[12px] leading-relaxed text-zinc-300"><code>{code}</code></pre>
    </div>
  );
}

function EndpointSection({ endpoint, origin }) {
  const [active, setActive] = useState(0);
  const variant = endpoint.variants[active];
  const path = variant.pathOverride || endpoint.path;
  const fullPath = `${path}${variant.query || ''}`;
  const curl = variant.body
    ? `curl -X POST '${origin}${fullPath}' \\\n  -H 'content-type: application/json' \\\n  -H 'authorization: Bearer $TOKEN' \\\n  -d '${variant.body.replace(/\s+/g, ' ')}'`
    : `curl '${origin}${fullPath}'`;

  return (
    <section id={endpoint.id} className="scroll-mt-24 rounded-2xl border border-white/5 bg-surface-2/40 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${METHOD_STYLES[endpoint.method]}`}>{endpoint.method}</span>
        <code className="text-sm font-semibold text-white">{endpoint.path}</code>
        {endpoint.auth && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
            <Icon name="lock" size={10} /> {endpoint.authLabel || 'Admin'}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-zinc-400">{endpoint.summary}</p>

      {endpoint.params && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="py-2 pr-3 font-semibold">Param</th>
                <th className="py-2 pr-3 font-semibold">Type</th>
                <th className="py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {endpoint.params.map(([name, type, notes]) => (
                <tr key={name} className="border-b border-white/5 last:border-0 align-top">
                  <td className="py-2 pr-3 font-mono text-brand">{name}</td>
                  <td className="py-2 pr-3 whitespace-nowrap text-zinc-400">{type}</td>
                  <td className="py-2 text-zinc-400">{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {endpoint.variants.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {endpoint.variants.map((v, i) => (
            <button
              key={v.label}
              type="button"
              onClick={() => setActive(i)}
              className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${i === active ? 'bg-brand text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <CodeBlock label={variant.body ? 'Request' : 'curl'} code={curl} />
        <CodeBlock label="Response" code={variant.response} />
      </div>
    </section>
  );
}

export default function Docs() {
  useDocumentMeta({ title: 'API Docs · Mr.Anime', description: 'Public JSON API reference for Mr.Anime: trending, search, anime details, schedule and availability.' });

  const [params, setParams] = useSearchParams();
  const hash = params.get('section');
  const origin = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : 'https://mranime.cyou'), []);

  return (
    <Container className="py-10 md:py-14">
      <PageHeader title="API Docs" description="The public JSON API behind Mr.Anime. Anime data is sourced from AniList." />

      <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="hidden lg:block">
          <div className="sticky top-24 space-y-1 text-sm">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Endpoints</p>
            {ENDPOINTS.map((e) => (
              <a
                key={e.id}
                href={`#${e.id}`}
                onClick={() => setParams({ section: e.id }, { replace: true })}
                className={`block truncate rounded-lg px-2.5 py-1.5 ${hash === e.id ? 'bg-white/5 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span className="mr-1.5 font-mono text-[10px] text-zinc-500">{e.method}</span>
                {e.title}
              </a>
            ))}
            <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Reference</p>
            <a href="#card" className="block rounded-lg px-2.5 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white">Card object</a>
            <a href="#errors" className="block rounded-lg px-2.5 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white">Errors</a>
          </div>
        </nav>

        <div className="min-w-0 space-y-5">
          <div className="rounded-2xl border border-white/5 bg-surface-2/40 p-5 text-sm text-zinc-400">
            <p>
              <strong className="text-white">Base URL:</strong> <code className="text-brand">{origin}</code>
            </p>
            <p className="mt-1">All routes live under <code className="text-zinc-300">/api/*</code> and return JSON. Public routes need no authentication.</p>
          </div>

          <section id="card" className="scroll-mt-24 rounded-2xl border border-white/5 bg-surface-2/40 p-5">
            <h2 className="text-base font-bold text-white">Card object</h2>
            <p className="mt-1 mb-3 text-sm text-zinc-400">Shared by grids, rows, batch results and recommendations.</p>
            <CodeBlock label="Card" code={CARD_EXAMPLE} />
          </section>

          {ENDPOINTS.map((e) => (
            <EndpointSection key={e.id} endpoint={e} origin={origin} />
          ))}

          <section id="errors" className="scroll-mt-24 rounded-2xl border border-white/5 bg-surface-2/40 p-5">
            <h2 className="text-base font-bold text-white">Errors</h2>
            <p className="mt-1 text-sm text-zinc-400">Every error uses the same envelope:</p>
            <div className="mt-3">
              <CodeBlock label="Error" code={`{ "error": "Human readable message.", "code": "ERROR_CODE" }`} />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="py-2 pr-3 font-semibold">HTTP</th>
                    <th className="py-2 pr-3 font-semibold">code</th>
                    <th className="py-2 font-semibold">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {ERRORS.map(([status, code, meaning]) => (
                    <tr key={code} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-3 font-mono text-zinc-300">{status}</td>
                      <td className="py-2 pr-3 font-mono text-brand">{code}</td>
                      <td className="py-2 text-zinc-400">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <Prose className="pt-2">
            <p className="text-xs text-zinc-500">
              Looking for a downloadable reference? See <Link to="/about">About</Link> for how the data pipeline works, or
              contact us via the <Link to="/dmca">DMCA &amp; contact</Link> page.
            </p>
          </Prose>
        </div>
      </div>
    </Container>
  );
}
