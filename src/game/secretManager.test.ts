import { describe, expect, it } from 'vitest';
import { canOpenRecord, collapse, listedRecords, sequenceSatisfied } from './secretManager';
import { canReachEnding } from './endingManager';
import { createSave, sanitizeSave } from './save';
import { RECORD_BY_ID } from '../data/records';
import { runSearch } from './search';

describe('secret A — broadcast order', () => {
  it('requires 001 → 003 → 007 as the latest distinct openings', () => {
    expect(sequenceSatisfied(['001', '003', '007'])).toBe(true);
    expect(sequenceSatisfied(['002', '001', '001', '003', '007', '007'])).toBe(true);
    expect(sequenceSatisfied(['001', '007', '003'])).toBe(false);
    expect(sequenceSatisfied(['001', '003', '005', '007'])).toBe(false);
    expect(collapse(['1', '1', '2', '2', '1'])).toEqual(['1', '2', '1']);
  });
});

describe('record access', () => {
  it('restricts 007 until 001 and 003 were consulted', () => {
    const save = createSave(0);
    expect(canOpenRecord(RECORD_BY_ID['007'], save, 0).ok).toBe(false);
    save.recordViews = { '001': 1, '003': 1 };
    expect(canOpenRecord(RECORD_BY_ID['007'], save, 0).ok).toBe(true);
  });

  it('opens 009 only at 02:00', () => {
    const save = createSave(0);
    expect(canOpenRecord(RECORD_BY_ID['009'], save, 4).ok).toBe(false);
    expect(canOpenRecord(RECORD_BY_ID['009'], save, 5).ok).toBe(true);
  });

  it('lists 013 once indexed', () => {
    const save = createSave(0);
    expect(listedRecords(save)).not.toContain('013');
    save.flags = ['record-013-indexed'];
    expect(listedRecords(save)).toContain('013');
    expect(canOpenRecord(RECORD_BY_ID['013'], save, 0).ok).toBe(true);
  });
});

describe('endings', () => {
  it('normal is always reachable; secret needs A+B; true needs A+B+C at 02:00', () => {
    const save = createSave(0);
    expect(canReachEnding('normal', save, 'day')).toBe(true);
    expect(canReachEnding('secret', save, 'day')).toBe(false);
    save.secretProgress.A.found = true;
    save.secretProgress.B.found = true;
    expect(canReachEnding('secret', save, 'day')).toBe(true);
    save.secretProgress.C.found = true;
    expect(canReachEnding('true', save, 'day')).toBe(false);
    expect(canReachEnding('true', save, 'after')).toBe(true);
  });
});

describe('save data', () => {
  it('resets malformed or foreign data safely', () => {
    expect(sanitizeSave(null, 5).visitCount).toBe(0);
    expect(sanitizeSave({ saveVersion: 99, visitCount: 7 }, 5).visitCount).toBe(0);
    const partial = sanitizeSave({ saveVersion: 1, visitCount: '3', flags: ['a', 4], secretProgress: { A: { found: true } } }, 5);
    expect(partial.visitCount).toBe(0);
    expect(partial.flags).toEqual(['a']);
    expect(partial.secretProgress.A.found).toBe(true);
    expect(partial.secretProgress.B.found).toBe(false);
  });
});

describe('search', () => {
  it('finds ordinary records and hides ROOM_02 until the archive is uneasy', () => {
    const save = createSave(0);
    expect(runSearch('방송', { save, level: 0 }).some((r) => r.key === '001')).toBe(true);
    expect(runSearch('02호실', { save, level: 2 }).some((r) => r.key === 'room-02')).toBe(true);
    expect(runSearch('room', { save, level: 0 }).some((r) => r.key === 'room-02')).toBe(false);
    expect(runSearch('room', { save, level: 2 }).some((r) => r.key === 'room-02')).toBe(true);
  });
});
