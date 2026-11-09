import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fetch helper with loading/error/data states, abort on unmount and retry.
 * `fetcher` must be a stable function (wrap in useCallback) that accepts { signal }.
 */
export function useApi(fetcher, deps = [], { enabled = true, initialData = null } = {}) {
  const [state, setState] = useState({ data: initialData, error: null, loading: enabled });
  const [attempt, setAttempt] = useState(0);
  const ref = useRef(fetcher);
  ref.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setState({ data: initialData, error: null, loading: false });
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    ref
      .current({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, error: null, loading: false });
      })
      .catch((err) => {
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        setState({ data: null, error: err, loading: false });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { ...state, retry };
}
