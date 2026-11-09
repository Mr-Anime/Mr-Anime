import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDismiss } from '../../lib/scroll.js';
import Icon from '../ui/Icon.jsx';
import Button from '../ui/Button.jsx';

export default function UserMenu({ compact = false }) {
  const { user, signOut, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(ref, () => setOpen(false), open);

  if (!user) {
    return (
      <Button to="/login" size={compact ? 'sm' : 'md'} variant="primary">
        <Icon name="user" size={16} />
        Login
      </Button>
    );
  }

  const initial = (user.username || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-white/10 p-0.5 pr-1 transition-colors hover:bg-white/10"
      >
        <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-accent text-sm font-bold text-white">
          {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : initial}
        </span>
        <Icon name="chevronDown" size={14} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-white/10 bg-surface-2/98 py-1.5 shadow-2xl shadow-black/60 backdrop-blur-md">
          <div className="border-b border-white/5 px-4 py-2">
            <p className="truncate text-sm font-semibold text-white">{user.username || 'Anime fan'}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
          <MenuLink to="/watchlist" icon="bookmark" onClick={() => setOpen(false)}>My Watchlist</MenuLink>
          <MenuLink to="/history" icon="clock" onClick={() => setOpen(false)}>Continue Watching</MenuLink>
          <MenuLink to="/profile" icon="settings" onClick={() => setOpen(false)}>Settings</MenuLink>
          {isAdmin && <MenuLink to="/admin" icon="grid" onClick={() => setOpen(false)}>Admin Panel</MenuLink>}
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-brand"
          >
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ to, icon, children, onClick }) {
  return (
    <Link role="menuitem" to={to} onClick={onClick} className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white">
      <Icon name={icon} size={16} />
      {children}
    </Link>
  );
}
