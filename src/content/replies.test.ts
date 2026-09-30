import { describe, expect, it } from 'vitest';
import { replyFor, type ReplyContext } from './replies';

const ctx = (over: Partial<ReplyContext> = {}): ReplyContext => ({ name: null, flags: [], counts: {}, nudge: null, ...over });

describe('free-text replies', () => {
  it('"who are you" escalates over repeated asks', () => {
    expect(replyFor('unknown', '너 누구야?', ctx()).lines).toEqual(['…', '정말 몰라요?']);
    expect(replyFor('unknown', '누구냐고', ctx({ counts: { 'unknown:who': 1 } })).lines[0]).toContain('이름을 적는 사람');
    expect(replyFor('unknown', '누구', ctx({ counts: { 'unknown:who': 5 } })).lines[0]).toContain('세 번째');
  });

  it('asking about 채원 without giving a name is refused', () => {
    expect(replyFor('unknown', '채원이야?', ctx()).lines[0]).toBe('이름을 먼저 말해 줘요.');
    expect(replyFor('unknown', '채원이야?', ctx({ name: '민지' })).lines[0]).toContain('민지');
  });

  it('falls back to what the story is waiting for', () => {
    expect(replyFor('unknown', '음', ctx({ nudge: '사진 앱. 맨 마지막 거요.' }), 0).lines).toEqual(['사진 앱. 맨 마지막 거요.']);
    // …but not every single time
    expect(replyFor('unknown', '음', ctx({ nudge: '사진 앱. 맨 마지막 거요.' }), 0.9).lines).not.toEqual(['사진 앱. 맨 마지막 거요.']);
    expect(replyFor('unknown', '음', ctx(), 0).rule).toBeNull();
  });

  it('채원 answers as herself', () => {
    expect(replyFor('self', '어디야', ctx()).lines[0]).toContain('제2서고');
    expect(replyFor('self', '뭘 해야 돼?', ctx({ nudge: '001 003 007' })).lines[0]).toBe('001 003 007');
  });

  it('도현 and 엄마 never get a scripted answer', () => {
    expect(replyFor('dohyun', '누구야', ctx()).rule).toBeNull();
  });

  it('채원 answers the name that was asked about, and knows the key only once it is found', () => {
    expect(replyFor('self', '서미령이 누구예요?', ctx()).rule).toBe('miryeong');
    expect(replyFor('self', '연장 열쇠가 뭐예요?', ctx()).lines[0]).toContain('몰라');
    expect(replyFor('self', '연장 열쇠가 뭐예요?', ctx({ flags: ['found-key'] })).lines[0]).toContain('색인을 끝낼');
    expect(replyFor('self', '도현이랑 처음 만난 날이 언제예요?', ctx()).rule).toBe('met');
  });
});
