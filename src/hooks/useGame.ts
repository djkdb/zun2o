import { useEffect, useState, useSyncExternalStore } from 'react';
import { getState, subscribe, type State } from '../engine/state';

/** Subscribe to a slice of game state. Selectors must return stable values. */
export function useGame<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getState()), () => selector(getState()));
}

/** Re-render every `ms` (for idle hints, timers). */
export function useTicker(ms: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Whose phone this is. From 01:50 on, it isn't hers any more. */
export function usePhoneOwner(): string {
  const ch4 = useGame((s) => s.save.flags.includes('ch4'));
  const name = useGame((s) => s.save.playerName);
  const s2 = useGame((s) => s.save.season === 2);
  // Season 2: 소연's phone. From 01:50, her name is the one being written.
  if (s2) return ch4 ? '한소연 — 안에 있음' : '소연의 휴대폰';
  if (!ch4) return '채원의 휴대폰';
  return `${name ?? '방문자 #0027'}의 휴대폰`;
}
