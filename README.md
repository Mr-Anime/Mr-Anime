# Mr.Anime

Crunchyroll-style anime streaming platform (creator-published, moderator-approved).

## Setup

1. Install deps: `npm install`
2. Create D1: `npx wrangler d1 create mr_anime` and update `wrangler.toml` database_id.
3. Create R2 bucket: `npx wrangler r2 bucket create mr-anime`
4. Generate migrations: `npx drizzle-kit generate` then `npx wrangler d1 migrations apply mr_anime`
5. Set secrets: `npx wrangler secret put AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ENCODER_WEBHOOK_SECRET`
6. Run dev: `npm run dev`

## Deploy

`npx @opennextjs/cloudflare build && npx wrangler deploy`

## Encoder

See `/encoder` Dockerfile. Runs Node + ffmpeg on a VPS, polls D1 transcode_jobs, downloads raw from R2, produces HLS, uploads to R2, calls signed webhook.
