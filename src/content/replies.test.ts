import { describe, expect, it } from 'vitest';
import { replyFor, type ReplyContext } from './replies';

const ctx = (over: Partial<ReplyContext> = {}): ReplyContext => ({ name: null, flags: [], counts: {}, nudge: null, ...over });

describe('free-text replies', () => {
  it('"who are you" escalates over repeated asks', () => {
    expect(replyFor('unknown', '너 누구야?', ctx()).lines).toEqual(['…', '정말 몰라요?']);
    expect(replyFor('unknown', '누구냐고', ctx({ counts: { 'unknown:who': 1 } })).lines[0]).toContain('기록하는 사람');
    expect(replyFor('unknown', '누구', ctx({ counts: { 'unknown:who': 5 } })).lines[0]).toContain('세 번째');
  });

  it('asking about 채원 without giving a name is refused', () => {
    expect(replyFor('unknown', '채원이야?', ctx()).lines[0]).toBe('이름을 먼저 말해 줘요.');
    expect(replyFor('unknown', '채원이야?', ctx({ name: '민지' })).lines[0]).toContain('민지');
  });

  it('falls back to what the story is waiting for', () => {
    expect(replyFor('unknown', '음', ctx({ nudge: '사진 앱. 맨 마지막 거요.' })).lines).toEqual(['사진 앱. 맨 마지막 거요.']);
    expect(replyFor('unknown', '음', ctx(), 0).rule).toBeNull();
  });

  it('채원 answers as herself', () => {
    expect(replyFor('self', '어디야', ctx()).lines[0]).toContain('02호실');
    expect(replyFor('self', '뭘 해야 돼?', ctx({ nudge: '001 003 007' })).lines[0]).toBe('001 003 007');
  });

  it('도현 and 엄마 never get a scripted answer', () => {
    expect(replyFor('dohyun', '누구야', ctx()).rule).toBeNull();
  });
});
