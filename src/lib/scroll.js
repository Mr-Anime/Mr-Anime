import { useEffect, useRef, useState } from 'react';

/** Scroll to top on route change (except when restoring from history). */
export function useScrollToTopOnNavigate(pathname) {
  useEffect(() => {
    if (window.history.state?.usr?.restoreScroll) return;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);
}

/** Shows a state after `delay` ms; resets when `value` goes falsy. */
export function useDelayedFlag(value, delay = 250) {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    if (!value) {
      setFlag(false);
      return undefined;
    }
    const t = setTimeout(() => setFlag(true), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return flag;
}

/** Tracks whether the user scrolled past a threshold. */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

/** Close on outside click / Escape. */
export function useDismiss(ref, onDismiss, active = true) {
  const cb = useRef(onDismiss);
  cb.current = onDismiss;
  useEffect(() => {
    if (!active) return;
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) cb.current();
    };
    const onKey = (e) => e.key === 'Escape' && cb.current();
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, active]);
}
