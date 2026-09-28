import { describe, expect, it } from 'vitest';
import { behaviourLevel, computeHorrorLevel, photoStage, timeLevel, variantFor, type EngineInput } from './horrorEngine';
import { phaseOf, msUntilNextTwo, parseClockString } from '../utils/time';

const base: EngineInput = {
  phase: 'day',
  visitCount: 1,
  sessionSeconds: 0,
  clickCount: 0,
  recordViews: {},
  discoveredAnomalies: 0,
  secretsFound: [],
  flags: [],
  levelOverride: null,
};

const at = (h: number, m: number, s = 0) => {
  const d = new Date(2026, 8, 28, h, m, s);
  return d;
};

describe('time phases', () => {
  it('maps the night into phases', () => {
    expect(phaseOf(at(1, 29, 59))).toBe('day');
    expect(phaseOf(at(1, 30))).toBe('late');
    expect(phaseOf(at(1, 45))).toBe('deep');
    expect(phaseOf(at(1, 55))).toBe('breaking');
    expect(phaseOf(at(1, 59))).toBe('threshold');
    expect(phaseOf(at(1, 59, 59))).toBe('threshold');
    expect(phaseOf(at(2, 0))).toBe('after');
    expect(phaseOf(at(2, 59, 59))).toBe('after');
    expect(phaseOf(at(3, 0))).toBe('aftermath');
    expect(phaseOf(at(14, 0))).toBe('day');
  });

  it('counts down to the next 02:00', () => {
    expect(msUntilNextTwo(at(1, 47, 23))).toBe((12 * 60 + 37) * 1000);
    expect(msUntilNextTwo(at(2, 0, 0))).toBe(24 * 3600 * 1000);
  });

  it('parses debug clock strings', () => {
    expect(parseClockString('01:59:50')).toEqual({ hours: 1, minutes: 59, seconds: 50 });
    expect(parseClockString('0200')).toEqual({ hours: 2, minutes: 0, seconds: 0 });
    expect(parseClockString('25:00')).toBeNull();
  });
});

describe('horror level', () => {
  it('is NORMAL on a first daytime visit', () => {
    expect(computeHorrorLevel(base)).toBe(0);
  });

  it('follows the clock', () => {
    expect(timeLevel('late')).toBe(1);
    expect(timeLevel('deep')).toBe(2);
    expect(timeLevel('breaking')).toBe(3);
    expect(timeLevel('threshold')).toBe(4);
    expect(timeLevel('after')).toBe(5);
    expect(computeHorrorLevel({ ...base, phase: 'after' })).toBe(5);
  });

  it('lets behaviour raise the level, but never past 3', () => {
    const obsessive: EngineInput = {
      ...base,
      visitCount: 9,
      sessionSeconds: 3600,
      clickCount: 500,
      recordViews: { '001': 5, '003': 9 },
      discoveredAnomalies: 20,
      secretsFound: ['A', 'B', 'D'],
    };
    expect(behaviourLevel(obsessive)).toBe(3);
    expect(computeHorrorLevel(obsessive)).toBe(3);
    expect(computeHorrorLevel({ ...base, visitCount: 2, sessionSeconds: 300 })).toBe(1);
  });

  it('respects the debug override', () => {
    expect(computeHorrorLevel({ ...base, phase: 'after', levelOverride: 2 })).toBe(2);
  });

  it('is calm after the true ending', () => {
    expect(computeHorrorLevel({ ...base, phase: 'after', flags: ['ending-true'] })).toBe(1);
  });
});

describe('photo stage (recognition loop)', () => {
  it('moves the figure closer over time and turns it at 02:00', () => {
    expect(photoStage(0, 1, [])).toBe(0);
    expect(photoStage(1, 2, [])).toBe(1);
    expect(photoStage(3, 1, [])).toBe(2);
    expect(photoStage(5, 0, [])).toBe(3);
    expect(photoStage(0, 0, ['saw-main-event'])).toBe(3);
    expect(photoStage(5, 0, ['ending-true'])).toBe(4);
  });
});

describe('variants', () => {
  it('picks the highest variant at or below the level', () => {
    const v = { 2: 'two', 4: 'four' } as const;
    expect(variantFor('zero', v, 0)).toBe('zero');
    expect(variantFor('zero', v, 3)).toBe('two');
    expect(variantFor('zero', v, 5)).toBe('four');
  });
});
