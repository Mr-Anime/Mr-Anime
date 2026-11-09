import { useState } from 'react';

/**
 * Lazy-loaded image with a blurred shimmer placeholder and fade-in.
 * Uses native loading="lazy" + decoding="async"; no observer needed.
 */
export default function LazyImage({ src, alt, className = '', imgClassName = '', sizes, priority = false, fallbackLabel }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-surface-3 ${className}`}>
      {!loaded && !failed && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-3 to-surface-2" />}
      {failed ? (
        <div className="flex h-full w-full items-center justify-center bg-surface-3 p-2 text-center text-xs text-zinc-500">
          {fallbackLabel || alt || 'No image'}
        </div>
      ) : (
        src && (
          <img
            src={src}
            alt={alt || ''}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            sizes={sizes}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`.replace(/\s+/g, ' ').trim()}
          />
        )
      )}
    </div>
  );
}
