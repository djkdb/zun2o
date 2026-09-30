import { describe, expect, it } from 'vitest';
import { BEATS } from '../content/script';
import { CALLS } from '../content/calls';
import { MEMO_TITLES, PHOTOS } from '../content/media';
import { ARCHIVE } from '../content/archive';
import { INITIAL_THREADS, lastSent } from '../content/threads';
import type { AppId, ChatMsg } from './types';

// Regression guards for the story data: everything a beat points at exists,
// time only moves forward inside a beat, and every call can be recovered.

const APPS: AppId[] = ['messages', 'gallery', 'notes', 'memos', 'browser', 'phone', 'settings', 'index'];
const night = (hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  return (h * 60 + m + 720) % 1440;
};

describe('story data', () => {
  it('attachments, photos and memos point at real content', () => {
    for (const b of BEATS)
      for (const a of b.actions) {
        if (a.t === 'photo') expect(PHOTOS.find((p) => p.id === a.id && p.extra), `${b.id} → photo ${a.id}`).toBeDefined();
        if (a.t === 'memo') expect(MEMO_TITLES[a.id], `${b.id} → memo ${a.id}`).toBeDefined();
        if (a.t === 'msg' && a.attach) {
          const at = a.attach;
          if (at.kind === 'photo') expect(PHOTOS.find((p) => p.id === at.id), `${b.id} → attach ${at.id}`).toBeDefined();
          if (at.kind === 'memo') expect(MEMO_TITLES[at.id]).toBeDefined();
        }
      }
  });

  it('hint targets and objectives are valid', () => {
    for (const b of BEATS)
      for (const a of b.actions)
        if (a.t === 'objective') {
          expect(a.text.length, b.id).toBeGreaterThan(3);
          expect(a.hint.length, b.id).toBeGreaterThan(8);
          if (a.app) expect(APPS, `${b.id} → app ${a.app}`).toContain(a.app);
        }
  });

  it('the in-game clock never runs backwards inside a beat', () => {
    for (const b of BEATS) {
      let last = -1;
      for (const a of b.actions)
        if (a.t === 'time') {
          expect(night(a.hm), `${b.id} at ${a.hm}`).toBeGreaterThanOrEqual(last);
          last = night(a.hm);
        }
    }
  });

  it('chapter 4 ticks one minute at a time up to 01:59, then the finale', () => {
    const ch4 = BEATS.find((b) => b.id === 'ch4')!;
    const times = ch4.actions.filter((a) => a.t === 'time').map((a) => (a.t === 'time' ? a.hm : ''));
    expect(times[0]).toBe('01:50');
    expect(times[times.length - 1]).toBe('01:59');
    for (let i = 1; i < times.length; i++) expect(night(times[i]) - night(times[i - 1]), times[i]).toBe(1);
    expect(ch4.actions[ch4.actions.length - 1].t).toBe('finale');
  });

  it("도현's first call can always be recovered: decline, hang-up and end all lead on", () => {
    for (const ev of ['call:dohyun1:decline', 'call:dohyun1:hangup', 'call:dohyun1:end']) expect(BEATS.some((b) => b.on === ev), ev).toBe(true);
    const done = (id: string) => BEATS.find((b) => b.id === id)!.actions.some((a) => a.t === 'emit' && a.ev === 'call1:done');
    expect(done('call1-decline2')).toBe(true);
    expect(done('call1-hangup2')).toBe(true);
  });

  it('every call ends with a hang-up line and has subtitles', () => {
    for (const c of Object.values(CALLS)) {
      const lines = [...c.lines, ...(c.after ?? [])];
      expect(lines.length, c.id).toBeGreaterThan(1);
      expect(lines.some((l) => l.who !== 'sfx'), c.id).toBe(true);
    }
  });

  it('the chain is told: booth photo, 박현우 article, the phone restarting', () => {
    expect(PHOTOS[0].id).toBe('p00');
    expect(ARCHIVE.news2.lines.join(' ')).toContain('교대했다');
    expect(BEATS.some((b) => b.actions.some((a) => a.t === 'reboot'))).toBe(true);
  });

  it('the message list puts the newest conversation first, across midnight', () => {
    const order = (t: typeof INITIAL_THREADS) => (Object.keys(t) as (keyof typeof t)[]).sort((a, b) => lastSent(t[b]) - lastSent(t[a]));
    // At the start: 도현 23:49, 엄마 23:10, the 02:00 message (early 9/27), 나에게 (9/26).
    expect(order(INITIAL_THREADS)).toEqual(['dohyun', 'mom', 'unknown', 'self']);
    const live = (time: string): ChatMsg => ({ id: `m${time}`, from: 'them', text: '', time });
    // 23:53 tonight beats 23:49; 00:10 after midnight beats both.
    const tonight = { ...INITIAL_THREADS, unknown: [...INITIAL_THREADS.unknown, live('23:53')] };
    expect(order(tonight)[0]).toBe('unknown');
    const later = { ...tonight, mom: [...INITIAL_THREADS.mom, live('00:10')] };
    expect(order(later)[0]).toBe('mom');
    // 나에게's history ends on the 26th, but a message there at 01:38 tonight is still the newest.
    const self = { ...later, self: [...INITIAL_THREADS.self, live('01:38')] };
    expect(order(self)[0]).toBe('self');
  });
});
