import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import SearchBar from './SearchBar.jsx';
import UserMenu from './UserMenu.jsx';
import Icon from '../ui/Icon.jsx';
import { useScrolled } from '../../lib/scroll.js';

export const NAV_LINKS = [
  { to: '/', label: 'Home', end: true, icon: 'home' },
  { to: '/browse', label: 'Browse', icon: 'grid' },
  { to: '/schedule', label: 'Schedule', icon: 'calendar' },
  { to: '/watchlist', label: 'Watchlist', icon: 'bookmark' },
];

export default function Navbar() {
  const scrolled = useScrolled(10);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setMobileSearch(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-300 ${scrolled || mobileOpen ? 'border-b border-white/5 bg-surface/90 backdrop-blur-xl' : 'bg-gradient-to-b from-black/60 to-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="-ml-1 grid h-10 w-10 place-items-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <Icon name={mobileOpen ? 'close' : 'menu'} size={22} />
        </button>

        <Logo onClick={() => setMobileOpen(false)} />

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden w-full max-w-xs lg:block xl:max-w-sm">
          <SearchBar />
        </div>

        <button
          type="button"
          onClick={() => setMobileSearch((o) => !o)}
          className="ml-auto grid h-10 w-10 place-items-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Toggle search"
          aria-expanded={mobileSearch}
        >
          <Icon name="search" size={20} />
        </button>

        <div className="hidden sm:block">
          <UserMenu />
        </div>
      </div>

      {mobileSearch && (
        <div className="border-t border-white/5 px-4 py-3 lg:hidden">
          <SearchBar autoFocusOnMount />
        </div>
      )}

      {mobileOpen && (
        <div className="border-t border-white/5 bg-surface/98 px-4 pb-6 pt-2 backdrop-blur-xl md:hidden">
          <nav className="space-y-1" aria-label="Mobile">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5'}`
                }
              >
                <Icon name={l.icon} size={18} />
                {l.label}
              </NavLink>
            ))}
            <NavLink to="/history" className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5'}`}>
              <Icon name="clock" size={18} />
              Continue Watching
            </NavLink>
          </nav>
          <div className="mt-4 border-t border-white/5 pt-4 sm:hidden">
            <UserMenu compact />
          </div>
        </div>
      )}
    </header>
  );
}
