import type { TimePhase } from '../game/types';

// Pure helpers for reading the local wall clock. The debug offset is applied
// by the caller (see game/clock.ts) so these stay deterministic and testable.

export interface ClockParts {
  hours: number;
  minutes: number;
  seconds: number;
}

export function partsOf(date: Date): ClockParts {
  return { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds() };
}

export function pad(n: number, width = 2): string {
  return String(Math.max(0, Math.floor(n))).padStart(width, '0');
}

export function formatClock(p: ClockParts): string {
  return `${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`;
}

export function formatHM(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** Seconds since local midnight. */
export function secondsOfDay(date: Date): number {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

const T = (h: number, m: number, s = 0) => h * 3600 + m * 60 + s;

export const PHASE_BOUNDS = {
  late: T(1, 30),
  deep: T(1, 45),
  breaking: T(1, 55),
  threshold: T(1, 59),
  after: T(2, 0),
  aftermath: T(3, 0),
  dawn: T(5, 0),
} as const;

export function phaseOf(date: Date): TimePhase {
  const s = secondsOfDay(date);
  if (s >= PHASE_BOUNDS.dawn || s < PHASE_BOUNDS.late) return 'day';
  if (s < PHASE_BOUNDS.deep) return 'late';
  if (s < PHASE_BOUNDS.breaking) return 'deep';
  if (s < PHASE_BOUNDS.threshold) return 'breaking';
  if (s < PHASE_BOUNDS.after) return 'threshold';
  if (s < PHASE_BOUNDS.aftermath) return 'after';
  return 'aftermath';
}

/** Milliseconds until the next local 02:00:00. */
export function msUntilNextTwo(date: Date): number {
  const target = new Date(date);
  target.setHours(2, 0, 0, 0);
  if (target.getTime() <= date.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - date.getTime();
}

/** The calendar day a given 02:00 belongs to, used to remember "tonight". */
export function nightKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A Date for today at the given local time. */
export function todayAt(base: Date, h: number, m: number, s = 0): Date {
  const d = new Date(base);
  d.setHours(h, m, s, 0);
  return d;
}

export function parseClockString(input: string): ClockParts | null {
  const m = /^(\d{1,2}):?(\d{2})(?::?(\d{2}))?$/.exec(input.trim());
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  const seconds = m[3] ? Number(m[3]) : 0;
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return { hours, minutes, seconds };
}
