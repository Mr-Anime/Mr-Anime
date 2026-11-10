export async function onRequest({ env, request }) {
  const appUrl = (env.APP_URL || new URL(request.url).origin).replace(/\/$/, '');
  const body = `User-agent: *
Disallow: /api/
Disallow: /watchlist
Disallow: /history
Disallow: /profile
Disallow: /admin
Disallow: /reset-password

Sitemap: ${appUrl}/sitemap.xml
`;
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' },
  });
}
