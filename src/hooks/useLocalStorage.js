import { useCallback, useEffect, useState } from 'react';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** useState backed by localStorage; syncs across tabs. */
export function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key) setValue(read(key, fallback));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, fallback]);

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        try {
          if (resolved == null) localStorage.removeItem(key);
          else localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* storage full or disabled — keep in-memory value */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set];
}
