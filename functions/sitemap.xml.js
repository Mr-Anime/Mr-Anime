import { anilistQuery, SITEMAP_QUERY } from './lib/anilist.js';
import { cachedJson } from './lib/cache.js';
import { mediaSlug } from '../src/lib/slug.js';

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
}

export async function onRequest({ env, request }) {
  const appUrl = (env.APP_URL || new URL(request.url).origin).replace(/\/$/, '');

  let items = [];
  try {
    const data = await cachedJson(env, 'sitemap:v2', 21600, async () => {
      const res = await anilistQuery(SITEMAP_QUERY, {}, { env });
      return { items: (res?.Page?.media || []).map((m) => ({ id: m.id, slug: mediaSlug(m) })) };
    });
    items = data?.items || [];
  } catch (err) {
    console.warn('[sitemap] AniList unavailable, emitting static entries only:', err.message);
  }

  const staticPaths = ['/', '/browse', '/schedule', '/about', '/dmca', '/terms', '/privacy'];
  const urls = [
    ...staticPaths.map((p) => `  <url><loc>${escapeXml(appUrl + p)}</loc></url>`),
    ...items.map((m) => `  <url><loc>${escapeXml(`${appUrl}/info/${m.id}/${m.slug}`)}</loc></url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
