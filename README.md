# Mr. Anime

Astro server-rendered anime discovery and community app using AniList metadata, Cloudflare Workers, and Cloudflare D1. Video playback is deliberately provider-neutral: connect only a video service you are licensed and authorized to embed.

## Project structure

```text
public/
  frames/                 Profile-frame SVGs and future frame assets
src/
  components/             Comment system and notifications
  layouts/                Shared site layout
  lib/                    AniList client and session/password helpers
  pages/
    api/                  D1-backed auth, comments, profile, moderation APIs
    watch/[id].astro      AniList title page and episode player
  styles/global.css       Pure project CSS (no CSS framework)
astro.config.mjs          Astro SSR + Cloudflare Workers adapter
schema.sql                Paste-ready Cloudflare D1 schema and starter items
wrangler.jsonc            Cloudflare Workers and D1 binding
```

## Run locally

1. Install Node.js 22 or later (required by the installed Wrangler version).
2. Run `npm install`.
3. Replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` in `wrangler.jsonc` with the UUID of your D1 database. Do not commit credentials or secrets.
4. Run `npm run dev`. Run `npm run check` and `npm run build` before deployment. `npm run deploy` deploys the already-built Worker and preserves Dashboard-managed variables.

Astro pages that call D1 use the Cloudflare runtime binding at `Astro.locals.runtime.env.DB`. Do not use a local SQLite file in production.

## Create and bind Cloudflare D1

1. In the Cloudflare Dashboard, open **Storage & databases → D1 SQL Database** and create a database named `mr-anime`.
2. Open that database's **Console** and execute the complete contents of `schema.sql`. It creates the tables and indexes plus three starter frame and name-style catalog entries.
3. Copy the database UUID from the database's **Settings** page. Replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` in `wrangler.jsonc` with that UUID. The ID is account-specific and must not be guessed.
4. Push this project to GitHub. In Cloudflare, go to **Workers & Pages → Create application → Workers → Import a repository**, connect the repository, and configure **Workers Builds** (not a Pages project).
5. Set the build command to `npm run build` and the deploy command to `npm run deploy`. Use Node.js 22 or later. No Pages build-output directory is needed; Astro's Cloudflare adapter generates the Worker entry point and static asset configuration.
6. The D1 binding is declared in `wrangler.jsonc` as `DB`. Keep the database UUID in that file aligned with the database selected for the Worker. If using separate preview and production databases, configure each environment with its own matching binding and ID.
7. In the Worker **Settings → Variables and Secrets**, optionally set `PLAYER_EMBED_BASE_URL` to your authorized HTTPS embed endpoint. The app adds `anilist=<AniList ID>` and `episode=<episode number>` query parameters. Leave it unset to show the player setup prompt. Never put secrets in `wrangler.jsonc`.
8. For a custom domain, open the Worker **Settings → Domains & Routes** and add the domain. It must be controlled by your Cloudflare account.

The adapter's generated `ASSETS` binding is the Workers static-assets binding and must not be renamed. Astro's built-in sessions and image optimizer are disabled because the app stores its own sessions in D1 and uses standard remote images. The project is configured for Workers; do not create or deploy it as a Pages project.

## First admin and roles

Create an account through the app first. Find its numeric `id` in the D1 `users` table and promote it from the D1 Console:

```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```

Replace `1` with the account's actual ID. This is intentionally a manual bootstrap; public registration can only create ordinary users. Admins can promote moderators and send notices from `/admin`; moderators can restrict accounts and remove comments. Restrictions and privileged routes are enforced server-side.

## Frames, styles, and promo codes

Add image assets under `public/frames/`, then add their catalog rows in the D1 Console. `frames.image_path` is a site path such as `/frames/frame-004.svg`; the table has no fixed item limit and can reference 100+ frames.

Example: add a profile frame and promo code (the item ID is the newly created frame ID):

```sql
INSERT INTO frames (slug, name, image_path) VALUES ('frame-004', 'Moonlight', '/frames/frame-004.svg');
INSERT INTO promo_codes (code, item_type, item_id, max_redemptions)
SELECT 'MOONLIGHT-2026', 'frame', id, 100 FROM frames WHERE slug = 'frame-004';
```

`item_type` can be `frame`, `name_style`, or `badge`; name-style rows should use CSS classes defined in `src/styles/global.css`. Users redeem codes at `/profile`; inventory is checked server-side before a profile item can be equipped.

## Playback and AniList

AniList's public GraphQL API supplies titles, covers, genres, and episode counts. The watch route uses the AniList ID and episode number. Set `PLAYER_EMBED_BASE_URL` only to an endpoint for content you own, have licensed, or are otherwise authorized to distribute. No third-party stream hosts or unlicensed stream catalog are bundled.
