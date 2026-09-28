import { useSyncExternalStore } from 'react';
import { useGame } from './useGame';

const query = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

function subscribeMotion(cb: () => void): () => void {
  query?.addEventListener('change', cb);
  return () => query?.removeEventListener('change', cb);
}

/** System reduced-motion preference OR the in-site "reduce effects" toggle. */
export function useReducedMotion(): boolean {
  const system = useSyncExternalStore(subscribeMotion, () => query?.matches ?? false, () => false);
  const setting = useGame((s) => s.save.reduceEffects);
  return system || setting;
}
