import { readItem, removeItem, writeItem } from '../utils/storage';

// ─────────────────────────────────────────────────────────────────────────
// Virtual clock: the user's real local time plus an optional debug offset.
// Only the Clock UI and the director subscribe to per-second updates, so the
// rest of the React tree does not re-render every second.
// ─────────────────────────────────────────────────────────────────────────

const OFFSET_KEY = 'na_time_offset';

let offset = Number(readItem(OFFSET_KEY, 'session') ?? 0) || 0;
let current = Date.now() + offset;
const listeners = new Set<() => void>();

export function getNow(): number {
  return Date.now() + offset;
}

export function getOffset(): number {
  return offset;
}

/** Shift the virtual clock so that "now" becomes the given local time today. */
export function setVirtualTime(h: number, m: number, s = 0): void {
  const target = new Date();
  target.setHours(h, m, s, 0);
  offset = target.getTime() - Date.now();
  writeItem(OFFSET_KEY, String(offset), 'session');
  publish();
}

export function resetVirtualTime(): void {
  offset = 0;
  removeItem(OFFSET_KEY, 'session');
  publish();
}

export function publish(): void {
  current = getNow();
  listeners.forEach((l) => l());
}

export function subscribeClock(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getClockSnapshot(): number {
  return current;
}

/** Milliseconds until the next whole virtual second. */
export function msToNextSecond(): number {
  return 1000 - (getNow() % 1000) + 8;
}
