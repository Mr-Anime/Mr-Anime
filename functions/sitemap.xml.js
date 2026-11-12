import { anilistQuery, SITEMAP_QUERY } from './lib/anilist.js';
import { cachedJson } from './lib/cache.js';

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
}

export async function onRequest({ env, request }) {
  const appUrl = (env.APP_URL || new URL(request.url).origin).replace(/\/$/, '');

  let items = [];
  try {
    const data = await cachedJson(env, 'sitemap:v1', 21600, async () => {
      const res = await anilistQuery(SITEMAP_QUERY, {}, { env });
      return { ids: (res?.Page?.media || []).map((m) => m.id) };
    });
    items = data?.ids || [];
  } catch (err) {
    console.warn('[sitemap] AniList unavailable, emitting static entries only:', err.message);
  }

  const staticPaths = ['/', '/browse', '/schedule', '/about', '/dmca', '/terms', '/privacy'];
  const urls = [
    ...staticPaths.map((p) => `  <url><loc>${escapeXml(appUrl + p)}</loc></url>`),
    ...items.map((id) => `  <url><loc>${escapeXml(`${appUrl}/anime/${id}`)}</loc></url>`),
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
