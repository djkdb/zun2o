import type { HorrorLevel, SaveData, SecretId, TimePhase } from './types';

// ─────────────────────────────────────────────────────────────────────────
// HorrorEngine — the single source of truth for "how wrong is the site
// right now". Pure functions only: input in, decisions out. Components never
// compare clocks or counters themselves; they ask the engine.
// ─────────────────────────────────────────────────────────────────────────

export interface EngineInput {
  phase: TimePhase;
  visitCount: number;
  sessionSeconds: number;
  clickCount: number;
  recordViews: Record<string, number>;
  discoveredAnomalies: number;
  secretsFound: SecretId[];
  flags: string[];
  levelOverride: HorrorLevel | null;
}

const TIME_LEVEL: Record<TimePhase, HorrorLevel> = {
  day: 0,
  aftermath: 0,
  late: 1,
  deep: 2,
  breaking: 3,
  threshold: 4,
  after: 5,
};

/** The level the clock alone demands. */
export function timeLevel(phase: TimePhase): HorrorLevel {
  return TIME_LEVEL[phase];
}

/**
 * Behaviour can make the archive uneasy even at noon, but never beyond
 * level 3: the last two stages belong to the night.
 */
export function behaviourScore(input: EngineInput): number {
  let score = 0;
  if (input.visitCount >= 2) score += 1;
  if (input.visitCount >= 4) score += 1;
  if (input.sessionSeconds >= 240) score += 1;
  if (input.sessionSeconds >= 600) score += 1;
  if (input.discoveredAnomalies >= 3) score += 1;
  if (input.discoveredAnomalies >= 8) score += 1;
  if (input.clickCount >= 60) score += 1;
  const totalViews = Object.values(input.recordViews).reduce((a, b) => a + b, 0);
  if (totalViews >= 6) score += 1;
  score += input.secretsFound.filter((s) => s !== 'C').length;
  return score;
}

export function behaviourLevel(input: EngineInput): HorrorLevel {
  const score = behaviourScore(input);
  if (score >= 7) return 3;
  if (score >= 4) return 2;
  if (score >= 2) return 1;
  return 0;
}

export function computeHorrorLevel(input: EngineInput): HorrorLevel {
  if (input.levelOverride !== null) return input.levelOverride;
  const t = timeLevel(input.phase);
  const b = behaviourLevel(input);
  const level = Math.max(t, b) as HorrorLevel;
  // After the true ending someone else is on shift. The night is quiet now.
  if (input.flags.includes('ending-true')) return Math.min(level, 1) as HorrorLevel;
  return level;
}

// ─── Derived presentation state ──────────────────────────────────────────

export interface LevelProfile {
  /** Gap range between ambient anomalies (ms). */
  ambientGap: [number, number];
  /** Session seconds before the first ambient anomaly may fire. */
  firstAmbientAfter: number;
  maxConcurrent: number;
  ambienceGain: number;
  droneGain: number;
  /** Always-on film grain / scanline overlay. */
  persistentGrain: boolean;
}

export const LEVEL_PROFILES: Record<HorrorLevel, LevelProfile> = {
  0: { ambientGap: [75_000, 150_000], firstAmbientAfter: 40, maxConcurrent: 1, ambienceGain: 0.05, droneGain: 0, persistentGrain: false },
  1: { ambientGap: [40_000, 80_000], firstAmbientAfter: 20, maxConcurrent: 1, ambienceGain: 0.045, droneGain: 0.01, persistentGrain: false },
  2: { ambientGap: [22_000, 45_000], firstAmbientAfter: 12, maxConcurrent: 1, ambienceGain: 0.035, droneGain: 0.03, persistentGrain: false },
  3: { ambientGap: [11_000, 24_000], firstAmbientAfter: 6, maxConcurrent: 2, ambienceGain: 0.025, droneGain: 0.05, persistentGrain: false },
  4: { ambientGap: [4_500, 9_000], firstAmbientAfter: 2, maxConcurrent: 2, ambienceGain: 0.012, droneGain: 0.08, persistentGrain: true },
  5: { ambientGap: [14_000, 30_000], firstAmbientAfter: 10, maxConcurrent: 1, ambienceGain: 0.02, droneGain: 0.06, persistentGrain: true },
};

/**
 * The reading-room photograph (Record 003) changes between viewings.
 * 0 — a shape in the far doorway, easy to miss
 * 1 — the shape has stepped into the room
 * 2 — it stands behind the archivist's chair
 * 3 — it faces the camera
 * 4 — after the true ending: the room is empty
 */
export function photoStage(level: HorrorLevel, views003: number, flags: string[]): 0 | 1 | 2 | 3 | 4 {
  if (flags.includes('ending-true')) return 4;
  if (level >= 5 || flags.includes('saw-main-event')) return 3;
  if (level >= 3) return 2;
  if (level >= 1 && views003 >= 2) return 1;
  if (views003 >= 3) return 1;
  return 0;
}

export function secretsFound(save: SaveData): SecretId[] {
  return (Object.keys(save.secretProgress) as SecretId[]).filter((id) => save.secretProgress[id].found);
}

export function engineInputFrom(
  save: SaveData,
  phase: TimePhase,
  sessionSeconds: number,
  levelOverride: HorrorLevel | null,
): EngineInput {
  return {
    phase,
    visitCount: save.visitCount,
    sessionSeconds,
    clickCount: save.clickCount,
    recordViews: save.recordViews,
    discoveredAnomalies: save.discoveredAnomalies.length,
    secretsFound: secretsFound(save),
    flags: save.flags,
    levelOverride,
  };
}

/** Select a variant string for the current level (highest key ≤ level). */
export function variantFor<T>(base: T, variants: Partial<Record<HorrorLevel, T>> | undefined, level: HorrorLevel): T {
  if (!variants) return base;
  for (let l = level; l >= 0; l--) {
    const v = variants[l as HorrorLevel];
    if (v !== undefined) return v;
  }
  return base;
}
