import { readItem, writeItem } from './storage';

// Debug mode: `?debug=true` in the URL (search or hash) enables the panel for
// this browser session. `?debug=false` turns it off again.
export function detectDebug(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.split('?')[1];
  const hashParams = new URLSearchParams(hashQuery ?? '');
  const flag = params.get('debug') ?? hashParams.get('debug');
  if (flag === 'true' || flag === '1') {
    writeItem('na_debug', '1', 'session');
    return true;
  }
  if (flag === 'false' || flag === '0') {
    writeItem('na_debug', '0', 'session');
    return false;
  }
  return readItem('na_debug', 'session') === '1';
}

/** Optional `?t=01:59:50` start time, honoured only in debug mode. */
export function detectStartTime(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('t');
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
