# Mr.Anime

Anime streaming website by Bazil (Biytri Technology) with built-in OAuth 2.0 Identity Provider.

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars
npx wrangler d1 create mr-anime-db
npx wrangler kv namespace create CACHE
# Update wrangler.jsonc with IDs
npx wrangler d1 migrations apply mr-anime-db --local
npm run dev
```

## First Admin

```bash
npx wrangler d1 execute mr-anime-db --local --command="UPDATE users SET role='admin', is_verified=1 WHERE email='your@email.com'"
```

## Deploy

```bash
npm run migrate
npm run deploy
```