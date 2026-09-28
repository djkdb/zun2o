import { describe, expect, it } from 'vitest';
import { rejectReason, selectAmbient, selectForAction, type AnomalyContext } from './eventManager';
import { ANOMALIES, ANOMALY_BY_ID } from '../data/anomalies';
import type { AnomalyTarget } from './types';

const allMounted = Object.fromEntries(
  ['title', 'welcome', 'intro', 'nav', 'clock', 'photo', 'record-list', 'record-body', 'record-title', 'footer'].map((t) => [t, 1]),
) as Partial<Record<AnomalyTarget, number>>;

const ctx = (over: Partial<AnomalyContext> = {}): AnomalyContext => ({
  now: 1_000_000,
  level: 0,
  sessionSeconds: 0,
  visitCount: 1,
  flags: [],
  discoveredAnomalies: [],
  viewedRecords: [],
  sessionCounts: {},
  lastFired: {},
  lifetime: {},
  mountedTargets: allMounted,
  busyTargets: new Set(),
  reduceEffects: false,
  ...over,
});

describe('anomaly catalogue', () => {
  it('has at least 20 anomalies with unique ids', () => {
    expect(ANOMALIES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(ANOMALIES.map((a) => a.id)).size).toBe(ANOMALIES.length);
  });

  it('covers every category', () => {
    const cats = new Set(ANOMALIES.map((a) => a.category));
    for (const c of ['text', 'image', 'ui', 'time', 'scroll', 'sound', 'screen']) expect(cats.has(c as never)).toBe(true);
  });
});

describe('eligibility rules', () => {
  const clockFreeze = ANOMALY_BY_ID['clock-freeze'];

  it('respects the level window', () => {
    expect(rejectReason(clockFreeze, ctx({ level: 0 }))).toBe('level');
    expect(rejectReason(clockFreeze, ctx({ level: 2 }))).toBeNull();
  });

  it('respects cooldown and session caps', () => {
    expect(rejectReason(clockFreeze, ctx({ level: 2, lastFired: { 'clock-freeze': 1_000_000 - 1000 } }))).toBe('cooldown');
    expect(rejectReason(clockFreeze, ctx({ level: 2, sessionCounts: { 'clock-freeze': 99 } }))).toBe('max-triggers');
  });

  it('never fires into a target that is not on screen', () => {
    expect(rejectReason(clockFreeze, ctx({ level: 2, mountedTargets: {} }))).toBe('unmounted');
  });

  it('skips intense effects when effects are reduced', () => {
    expect(rejectReason(ANOMALY_BY_ID['screen-dark'], ctx({ level: 3, reduceEffects: true }))).toBe('reduced');
  });

  it('never jump-scares before the archive is already wrong (level 2+)', () => {
    const scares = ANOMALIES.filter((a) => a.target === 'scare');
    expect(scares.length).toBeGreaterThanOrEqual(4);
    for (const a of scares) expect(a.minLevel).toBeGreaterThanOrEqual(2);
    for (const a of scares.filter((x) => x.effect === 'lunge')) expect(a.trigger.kind).toBe('action');
  });

  it('keeps level 0 almost silent', () => {
    const early = ANOMALIES.filter((a) => a.trigger.kind === 'ambient' && rejectReason(a, ctx({ level: 0, sessionSeconds: 10 })) === null);
    expect(early).toEqual([]);
  });
});

describe('selection', () => {
  it('reacts to hovering record 007 even on a first visit', () => {
    const picked = selectForAction({ type: 'hover', target: 'record-007' }, ANOMALIES, ctx(), () => 0);
    expect(picked.map((a) => a.id)).toContain('record-007-hover');
  });

  it('picks ambient anomalies only when eligible', () => {
    expect(selectAmbient(ANOMALIES, ctx({ level: 0 }), () => 0)).toBeUndefined();
    const chosen = selectAmbient(ANOMALIES, ctx({ level: 3, sessionSeconds: 600 }), () => 0);
    expect(chosen).toBeDefined();
    expect(chosen!.minLevel).toBeLessThanOrEqual(3);
  });
});
