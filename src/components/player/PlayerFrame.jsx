import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';

/**
 * Cross-origin iframes can't be inspected, so we show a "trouble loading?"
 * hint if the frame still isn't loaded after a while. The user can switch
 * provider manually (by design).
 */
export default function PlayerFrame({ src, provider, title, onLoad }) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, [src]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center gap-3 bg-black/80 text-zinc-400">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Loading video" />
            <p className="text-sm">Loading from {provider?.name || 'provider'}…</p>
            {slow && <p className="text-xs text-zinc-500">Taking a while? Try another provider below.</p>}
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        key={src}
        src={src}
        title={title}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="origin"
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
      />
      <noscript>
        <p className="p-4 text-sm text-zinc-300">Enable JavaScript to watch on Mr.Anime.</p>
      </noscript>
      {loaded && (
        <div className="pointer-events-none absolute right-2 top-2 hidden items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] text-zinc-300 backdrop-blur sm:flex">
          <Icon name="shield" size={11} />
          {provider?.name}
        </div>
      )}
    </div>
  );
}
