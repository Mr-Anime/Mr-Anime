import { LegalPage } from '../components/ui/Prose.jsx';
import { useDocumentMeta } from '../lib/meta.js';

export default function Terms() {
  useDocumentMeta({ title: 'Terms of Service', description: 'The terms that govern your use of Mr.Anime.' });

  return (
    <LegalPage title="Terms of Service" description="Please read these terms before using Mr.Anime." updated="10 November 2026">
      <h2>1. Acceptance</h2>
      <p>By accessing or using Mr.Anime you agree to these Terms. If you do not agree, do not use the site.</p>
      <h2>2. The service</h2>
      <p>
        Mr.Anime provides anime metadata, discovery tools and an interface that embeds third-party video players. We do not host
        video content. Availability of any title or stream depends on the third-party provider and may change or disappear at any time.
      </p>
      <h2>3. Accounts</h2>
      <ul>
        <li>You are responsible for keeping your password secure.</li>
        <li>One person per account; do not share credentials.</li>
        <li>We may suspend accounts that abuse the service or violate these Terms.</li>
      </ul>
      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Scrape, overload, or attempt to circumvent rate limits on our APIs.</li>
        <li>Use the service to distribute malware, spam or unlawful content.</li>
        <li>Interfere with other users' access to the service.</li>
      </ul>
      <h2>5. Intellectual property</h2>
      <p>
        Anime titles, artwork and descriptions belong to their respective rights holders and are provided via AniList. The Mr.Anime
        name, logo and original site code remain our property.
      </p>
      <h2>6. Disclaimer</h2>
      <p>
        The service is provided “as is” without warranties of any kind. We do not guarantee uptime, accuracy of metadata, or that
        any embedded stream will work.
      </p>
      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Mr.Anime is not liable for indirect, incidental or consequential damages arising from
        your use of the service.
      </p>
      <h2>8. Changes</h2>
      <p>We may update these Terms; continued use after changes means you accept the revised Terms.</p>
      <h2>9. Contact</h2>
      <p>Questions about these Terms: mranimeweb@gmail.com</p>
    </LegalPage>
  );
}
