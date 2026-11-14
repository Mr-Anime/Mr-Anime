import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';

/** Keeps old /anime/:id and /watch/:id/:episode links working. */
export default function LegacyRedirect({ type }) {
  const { anilistId, episode } = useParams();
  const { pathname } = useLocation();
  const [sp] = useSearchParams();

  if (type === 'info' || pathname.startsWith('/anime/')) return <Navigate to={`/info/${anilistId}`} replace />;

  const lang = sp.get('lang') === 'dub' ? 'dub' : 'sub';
  const server = sp.get('server');
  const query = new URLSearchParams({ lang });
  if (server) query.set('server', server);
  return <Navigate to={`/player/anime-${anilistId}/${Math.max(1, Number(episode) || 1)}?${query}`} replace />;
}
