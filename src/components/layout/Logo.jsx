import { Link } from 'react-router-dom';

export default function Logo({ compact = false, onClick }) {
  return (
    <Link to="/" onClick={onClick} className="group flex items-center gap-2.5" aria-label="Mr.Anime home">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand to-accent shadow-lg shadow-brand/20">
        <svg viewBox="0 0 32 32" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 24V8l6 7 4-4 4 4 6-7v16" />
        </svg>
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight text-white">
          Mr.<span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">Anime</span>
        </span>
      )}
    </Link>
  );
}
