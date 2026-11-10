import { LegalPage } from '../components/ui/Prose.jsx';
import { useDocumentMeta } from '../lib/meta.js';

export default function Dmca() {
  useDocumentMeta({ title: 'DMCA & contact', description: 'Copyright takedown requests and contact information for Mr.Anime.' });

  return (
    <LegalPage
      title="DMCA & contact"
      description="Copyright notices, takedown requests and general contact."
      updated="10 November 2026"
    >
      <h2>Important notice</h2>
      <p>
        Mr.Anime does not host, upload or store any video files. All streams are embedded from third-party services.
        We do not control the content on those services and are not affiliated with them.
      </p>
      <h2>Copyright takedown requests</h2>
      <p>If you believe material accessible through this site infringes your copyright, send a notice to our designated agent including:</p>
      <ul>
        <li>Your contact details (name, address, email).</li>
        <li>Identification of the copyrighted work claimed to be infringed.</li>
        <li>The exact page URLs on this site where the material appears.</li>
        <li>A statement that you have a good-faith belief the use is not authorised.</li>
        <li>A statement, under penalty of perjury, that the information is accurate and you are the owner or authorised to act on the owner's behalf.</li>
        <li>Your physical or electronic signature.</li>
      </ul>
      <p>
        Email: <strong>dmca@mranime.cyou</strong>
      </p>
      <p>
        Valid requests are actioned promptly. Because video is embedded from third parties, we may remove the link or block the
        embedded provider for the affected title. Please contact the source provider directly as well.
      </p>
      <h2>Broken links & server issues</h2>
      <p>
        If a video server fails to load or an episode is wrong, include the anime title, episode number and the server name
        shown in the player. We review reports weekly.
      </p>
      <h2>General contact</h2>
      <p>
        Business and other enquiries: <strong>hello@mranime.cyou</strong>
      </p>
    </LegalPage>
  );
}
