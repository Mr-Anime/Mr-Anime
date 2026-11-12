import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

const LINKS = [
  { to: '/about', label: 'About' },
  { to: '/docs', label: 'API Docs' },
  { to: '/dmca', label: 'DMCA / Contact' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/privacy', label: 'Privacy Policy' },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-surface-2/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Stream your favorite anime with sub and dub, track what you watch and never miss a new episode.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm" aria-label="Footer">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="text-zinc-400 transition-colors hover:text-white">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 border-t border-white/5 pt-6">
          <p className="text-xs leading-relaxed text-zinc-600">
            Mr.Anime does not host any video files. All content is provided by third-party embed providers and metadata is
            sourced from AniList. If you are a rights holder, please see our{' '}
            <Link to="/dmca" className="text-zinc-500 underline hover:text-zinc-300">DMCA page</Link>.
          </p>
          <p className="mt-3 text-xs text-zinc-600">© {new Date().getFullYear()} Mr.Anime. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
