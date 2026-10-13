/* Ad scripts must be synchronous: these networks inject their iframe via
 * document.write during the HTML parse — async/deferred loading breaks them. */
/* eslint-disable @next/next/no-sync-scripts */
import { getAdSettings } from "@/lib/settings";

/**
 * Renders monetization scripts server-side (SSR) only when enabled from
 * /admin/ads. The banner invoke.js relies on document.write during HTML
 * parse, so these must be plain SSR <script> tags — never next/script.
 */
export async function AdManager() {
  const { banner, social } = await getAdSettings();
  if (!banner && !social) return null;

  return (
    <>
      {banner ? (
        <div className="mx-auto w-full max-w-[728px] px-4 py-3">
          <script
            dangerouslySetInnerHTML={{
              __html: `atOptions = {
  'key' : '2659d65266eed317cec7d0356f47b8d2',
  'format' : 'iframe',
  'height' : 90,
  'width' : 728,
  'params' : {}
};`,
            }}
          />
          <script src="https://www.highrevenueformat.com/2659d65266eed317cec7d0356f47b8d2/invoke.js" />
        </div>
      ) : null}
      {social ? (
        <script src="https://pl31804834.profitableratecpmnetwork.com/41/79/0e/41790ed493533586eed08ea60de12ea3.js" />
      ) : null}
    </>
  );
}
