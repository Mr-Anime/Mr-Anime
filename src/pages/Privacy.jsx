import { LegalPage } from '../components/ui/Prose.jsx';
import { useDocumentMeta } from '../lib/meta.js';

export default function Privacy() {
  useDocumentMeta({ title: 'Privacy Policy', description: 'What data Mr.Anime collects and how it is used.' });

  return (
    <LegalPage title="Privacy Policy" description="How we handle your data." updated="10 November 2026">
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account data</strong> — email address, a username you choose, and optionally an avatar URL. Passwords are hashed by our auth provider; we never see them.</li>
        <li><strong>Library data</strong> — the titles on your watchlist and the episodes in your history, linked to your account.</li>
        <li><strong>Local preferences</strong> — things like your preferred player server are kept in your browser's local storage.</li>
      </ul>
      <h2>What we don't collect</h2>
      <p>We do not sell personal data. We do not run advertising trackers. We do not host or observe the video streams themselves.</p>
      <h2>Third parties</h2>
      <ul>
        <li><strong>AniList</strong> — anime metadata is fetched from the AniList GraphQL API.</li>
        <li><strong>Supabase</strong> — stores accounts, watchlists and history.</li>
        <li><strong>Cloudflare</strong> — serves the site and caches API responses.</li>
        <li><strong>Video providers</strong> — when you press play, your browser loads an embedded player from a third-party domain. Those providers may set their own cookies or collect usage data under their own policies.</li>
      </ul>
      <h2>Cookies & storage</h2>
      <p>
        We use browser storage only for keeping you signed in and remembering UI preferences. We do not use marketing cookies.
      </p>
      <h2>Retention & deletion</h2>
      <p>
        Your account, watchlist and history remain until you delete them. Contact us at privacy@mranime.cyou to request deletion of
        your account and associated data.
      </p>
      <h2>Children</h2>
      <p>Mr.Anime is not directed at children under 13 and we do not knowingly collect their data.</p>
      <h2>Changes</h2>
      <p>If this policy changes materially we will post the update on this page.</p>
    </LegalPage>
  );
}
