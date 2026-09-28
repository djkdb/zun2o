import type { ArchiveRecord, HorrorLevel, SaveData } from './types';
import { LISTED_RECORD_IDS, SEQUENCE_A } from '../data/records';

// ─────────────────────────────────────────────────────────────────────────
// Secret manager — record access rules and secret-path conditions.
// ─────────────────────────────────────────────────────────────────────────

/** Collapse consecutive repeats: [1,1,3,3,7] → [1,3,7]. */
export function collapse(seq: readonly string[]): string[] {
  return seq.filter((id, i) => i === 0 || seq[i - 1] !== id);
}

/** Secret A: the last three distinct openings follow the broadcast order. */
export function sequenceSatisfied(seq: readonly string[]): boolean {
  const c = collapse(seq);
  if (c.length < SEQUENCE_A.length) return false;
  const tail = c.slice(-SEQUENCE_A.length);
  return tail.every((id, i) => id === SEQUENCE_A[i]);
}

export type AccessResult =
  | { ok: true }
  | { ok: false; reason: 'restricted' | 'denied' | 'hidden'; message: string; detail?: string };

export function canOpenRecord(record: ArchiveRecord, save: SaveData, level: HorrorLevel): AccessResult {
  switch (record.access) {
    case 'public':
      return { ok: true };
    case 'restricted': {
      const viewed = (id: string) => (save.recordViews[id] ?? 0) > 0;
      if (viewed('001') && viewed('003')) return { ok: true };
      return {
        ok: false,
        reason: 'restricted',
        message: '열람 제한 기록입니다.',
        detail: '이 기록이 참조하는 기록(001, 003)을 먼저 열람한 사람만 볼 수 있습니다.',
      };
    }
    case 'denied':
      if (level >= 5) return { ok: true };
      return {
        ok: false,
        reason: 'denied',
        message: '[접근 거부]',
        detail: '기록 009는 이 시간에 열람할 수 없습니다.',
      };
    case 'hidden':
      if (save.flags.includes('record-013-indexed')) return { ok: true };
      return {
        ok: false,
        reason: 'hidden',
        message: '색인에 없는 기록',
        detail: '이 번호는 방송 순서를 따라온 열람자에게만 색인에 나타납니다.',
      };
  }
}

/** Record ids visible in the index right now. */
export function listedRecords(save: SaveData): string[] {
  const ids = [...LISTED_RECORD_IDS];
  if (save.flags.includes('record-013-indexed')) ids.push('013');
  return ids;
}
