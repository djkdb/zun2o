import type { EndingId, SaveData, SecretId, SecretProgress } from './types';
import { readItem, removeItem, writeItem } from '../utils/storage';

export const SAVE_KEY = 'night-archive:save';
export const SAVE_VERSION = 1 as const;
const MAX_LOG = 24;
const MAX_SEQUENCE = 12;
const MAX_GUESTBOOK = 20;

const SECRET_IDS: SecretId[] = ['A', 'B', 'C', 'D'];
const ENDING_IDS: EndingId[] = ['normal', 'secret', 'true'];

export function createSave(now: number): SaveData {
  return {
    saveVersion: SAVE_VERSION,
    firstVisit: now,
    lastVisit: now,
    lastActive: now,
    visitCount: 0,
    visitLog: [],
    totalVisitDuration: 0,
    clickCount: 0,
    recordViews: {},
    recordSequence: [],
    discoveredRecords: [],
    discoveredAnomalies: [],
    anomalyLifetime: {},
    secretProgress: { A: { found: false }, B: { found: false }, C: { found: false }, D: { found: false } },
    flags: [],
    endingUnlocked: [],
    lastEnding: null,
    mainEventNights: [],
    soundPreference: 'on',
    reduceEffects: false,
    guestbook: [],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const strArr = (v: unknown, max = 200): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(-max) : [];
const numRecord = (v: unknown): Record<string, number> => {
  if (!isObj(v)) return {};
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v)) if (typeof val === 'number' && Number.isFinite(val)) out[k] = val;
  return out;
};

/**
 * Validates arbitrary JSON into a SaveData. Unknown or malformed fields are
 * replaced with safe defaults field-by-field; an unknown version resets.
 */
export function sanitizeSave(raw: unknown, now: number): SaveData {
  const base = createSave(now);
  if (!isObj(raw) || raw.saveVersion !== SAVE_VERSION) return base;

  const secretsRaw = isObj(raw.secretProgress) ? raw.secretProgress : {};
  const secretProgress = { ...base.secretProgress };
  for (const id of SECRET_IDS) {
    const entry = secretsRaw[id];
    if (isObj(entry) && typeof entry.found === 'boolean') {
      const progress: SecretProgress = { found: entry.found };
      if (typeof entry.at === 'number') progress.at = entry.at;
      secretProgress[id] = progress;
    }
  }

  const guestbook = Array.isArray(raw.guestbook)
    ? raw.guestbook
        .filter((g): g is { text: string; at: number } => isObj(g) && typeof g.text === 'string' && typeof g.at === 'number')
        .map((g) => ({ text: g.text.slice(0, 280), at: g.at }))
        .slice(-MAX_GUESTBOOK)
    : [];

  return {
    saveVersion: SAVE_VERSION,
    firstVisit: num(raw.firstVisit, now),
    lastVisit: num(raw.lastVisit, now),
    lastActive: num(raw.lastActive, now),
    visitCount: Math.max(0, Math.floor(num(raw.visitCount, 0))),
    visitLog: Array.isArray(raw.visitLog)
      ? raw.visitLog.filter((x): x is number => typeof x === 'number' && Number.isFinite(x)).slice(-MAX_LOG)
      : [],
    totalVisitDuration: Math.max(0, num(raw.totalVisitDuration, 0)),
    clickCount: Math.max(0, Math.floor(num(raw.clickCount, 0))),
    recordViews: numRecord(raw.recordViews),
    recordSequence: strArr(raw.recordSequence, MAX_SEQUENCE),
    discoveredRecords: strArr(raw.discoveredRecords),
    discoveredAnomalies: strArr(raw.discoveredAnomalies),
    anomalyLifetime: numRecord(raw.anomalyLifetime),
    secretProgress,
    flags: strArr(raw.flags),
    endingUnlocked: strArr(raw.endingUnlocked).filter((e): e is EndingId => (ENDING_IDS as string[]).includes(e)),
    lastEnding:
      typeof raw.lastEnding === 'string' && (ENDING_IDS as string[]).includes(raw.lastEnding)
        ? (raw.lastEnding as EndingId)
        : null,
    mainEventNights: strArr(raw.mainEventNights, 60),
    soundPreference: raw.soundPreference === 'off' ? 'off' : 'on',
    reduceEffects: raw.reduceEffects === true,
    guestbook,
  };
}

export function loadSave(now: number): SaveData {
  const text = readItem(SAVE_KEY);
  if (!text) return createSave(now);
  try {
    return sanitizeSave(JSON.parse(text), now);
  } catch {
    // Corrupted JSON: start fresh rather than crash.
    return createSave(now);
  }
}

export function persistSave(save: SaveData): void {
  writeItem(SAVE_KEY, JSON.stringify(save));
}

export function clearSave(): void {
  removeItem(SAVE_KEY);
}

export const limits = { MAX_LOG, MAX_SEQUENCE, MAX_GUESTBOOK };
