import { useSyncExternalStore } from 'react';
import { parseHash, type Route } from '../utils/router';

let cached: { hash: string; route: Route } | null = null;

function snapshot(): Route {
  const hash = window.location.hash;
  if (!cached || cached.hash !== hash) cached = { hash, route: parseHash(hash) };
  return cached.route;
}

function subscribeHash(cb: () => void): () => void {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribeHash, snapshot, snapshot);
}
