import { useSyncExternalStore } from 'react';
import { getClockSnapshot, subscribeClock } from '../game/clock';

/** Current virtual time (ms), updated once per second by the director. */
export function useLocalTime(): number {
  return useSyncExternalStore(subscribeClock, getClockSnapshot, getClockSnapshot);
}
