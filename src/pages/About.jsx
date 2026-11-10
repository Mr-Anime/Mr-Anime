import { Link } from 'react-router-dom';
import Container from '../components/ui/Container.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import Prose from '../components/ui/Prose.jsx';
import { useDocumentMeta } from '../lib/meta.js';

const FEATURES = [
  { icon: 'film', title: 'Huge catalogue', text: 'Tens of thousands of titles sourced from AniList metadata, updated all day.' },
  { icon: 'clock', title: 'Airing schedule', text: 'See exactly when the next episode of any currently airing series drops.' },
  { icon: 'bookmark', title: 'Watchlist & history', text: 'Track what you plan to watch and jump back into the exact episode you left.' },
  { icon: 'shield', title: 'No files hosted', text: 'We only embed streams from third-party providers — nothing is stored on our servers.' },
];

export default function About() {
  useDocumentMeta({ title: 'About Mr.Anime', description: 'What Mr.Anime is, how it works and where the data comes from.' });

  return (
    <Container className="py-10 md:py-14">
      <PageHeader title="About Mr.Anime" description="A fast, clean way to discover and keep track of anime." />

      <div className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-white/5 bg-surface-2/60 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
              <Icon name={f.icon} size={19} />
            </span>
            <h2 className="mt-3 text-sm font-semibold text-white">{f.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">{f.text}</p>
          </div>
        ))}
      </div>

      <Prose>
        <h2>How it works</h2>
        <p>
          Mr.Anime is a catalogue and player interface. Anime information (titles, covers, episodes, airing data) comes from the
          public <a href="https://anilist.co" target="_blank" rel="noopener noreferrer nofollow">AniList</a> GraphQL API, cached at the edge for speed.
          Video streams are embedded from third-party providers and are not hosted by us.
        </p>
        <h2>Accounts</h2>
        <p>
          Creating an account lets you keep a watchlist and history in sync across devices. Accounts are optional — browsing works
          without signing in.
        </p>
        <h2>Get in touch</h2>
        <p>
          Questions, bug reports or takedown requests? Head to the <Link to="/dmca">DMCA &amp; contact</Link> page.
        </p>
      </Prose>

      <div className="mt-10 flex flex-wrap gap-2">
        <Button to="/browse">
          <Icon name="grid" size={16} />
          Start browsing
        </Button>
        <Button to="/dmca" variant="secondary">Contact us</Button>
      </div>
    </Container>
  );
}
