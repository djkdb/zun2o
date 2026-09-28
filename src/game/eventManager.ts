import type { AnomalyDef, AnomalyTarget, GameAction, HorrorLevel } from './types';
import { type Rng, weightedPick } from '../utils/random';

// ─────────────────────────────────────────────────────────────────────────
// Event manager — decides *which* anomaly may happen *now*.
// Anomalies are data (data/anomalies.ts); this module only applies the rules:
// level window, prerequisites, cooldown, per-session cap, lifetime "once",
// probability, whether anyone is on screen to see it, and target collisions.
// ─────────────────────────────────────────────────────────────────────────

export interface AnomalyContext {
  now: number;
  level: HorrorLevel;
  sessionSeconds: number;
  visitCount: number;
  flags: readonly string[];
  discoveredAnomalies: readonly string[];
  viewedRecords: readonly string[];
  sessionCounts: Readonly<Record<string, number>>;
  lastFired: Readonly<Record<string, number>>;
  lifetime: Readonly<Record<string, number>>;
  /** Targets currently rendered on screen (ref-counted). */
  mountedTargets: Readonly<Partial<Record<AnomalyTarget, number>>>;
  /** Targets that already display an anomaly. */
  busyTargets: ReadonlySet<AnomalyTarget>;
  reduceEffects: boolean;
}

export type RejectReason =
  | 'level'
  | 'cooldown'
  | 'max-triggers'
  | 'once'
  | 'requirements'
  | 'unmounted'
  | 'busy'
  | 'reduced';

/** Returns null when eligible, otherwise why not (useful for the debug panel). */
export function rejectReason(def: AnomalyDef, ctx: AnomalyContext): RejectReason | null {
  if (ctx.level < def.minLevel || ctx.level > def.maxLevel) return 'level';
  if (def.intense && ctx.reduceEffects) return 'reduced';
  if (def.once && (ctx.lifetime[def.id] ?? 0) > 0) return 'once';
  if ((ctx.sessionCounts[def.id] ?? 0) >= def.maxTriggers) return 'max-triggers';
  const last = ctx.lastFired[def.id];
  if (last !== undefined && ctx.now - last < def.cooldown) return 'cooldown';
  const req = def.requires;
  if (req) {
    if (req.minVisits !== undefined && ctx.visitCount < req.minVisits) return 'requirements';
    if (req.minSessionSeconds !== undefined && ctx.sessionSeconds < req.minSessionSeconds) return 'requirements';
    if (req.flags && !req.flags.every((f) => ctx.flags.includes(f))) return 'requirements';
    if (req.notFlags && req.notFlags.some((f) => ctx.flags.includes(f))) return 'requirements';
    if (req.anomalies && !req.anomalies.every((a) => ctx.discoveredAnomalies.includes(a))) return 'requirements';
    if (req.records && !req.records.every((r) => ctx.viewedRecords.includes(r))) return 'requirements';
  }
  // Global targets (screen/audio/scroll) are always "mounted".
  const alwaysOn: AnomalyTarget[] = ['screen', 'audio', 'scroll'];
  if (!alwaysOn.includes(def.target) && !(ctx.mountedTargets[def.target] ?? 0)) return 'unmounted';
  if (ctx.busyTargets.has(def.target)) return 'busy';
  return null;
}

export function isEligible(def: AnomalyDef, ctx: AnomalyContext): boolean {
  return rejectReason(def, ctx) === null;
}

export function matches(pattern: string, value: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) return value.startsWith(pattern.slice(0, -1));
  return pattern === value;
}

/** Anomalies reacting to a user action. At most one per target. */
export function selectForAction(
  action: GameAction,
  defs: readonly AnomalyDef[],
  ctx: AnomalyContext,
  rng: Rng,
): AnomalyDef[] {
  const chosen: AnomalyDef[] = [];
  const busy = new Set(ctx.busyTargets);
  for (const def of defs) {
    if (def.trigger.kind !== 'action') continue;
    if (def.trigger.type !== action.type || !matches(def.trigger.match, action.target)) continue;
    if (!isEligible(def, { ...ctx, busyTargets: busy })) continue;
    if (rng() > def.probability) continue;
    chosen.push(def);
    busy.add(def.target);
  }
  return chosen;
}

/** One ambient anomaly, chosen by weight among the eligible ones. */
export function selectAmbient(defs: readonly AnomalyDef[], ctx: AnomalyContext, rng: Rng): AnomalyDef | undefined {
  const eligible = defs.filter((d) => d.trigger.kind === 'ambient' && isEligible(d, ctx));
  const candidate = weightedPick(rng, eligible, (d) => d.weight ?? 1);
  if (!candidate) return undefined;
  return rng() <= candidate.probability ? candidate : undefined;
}
