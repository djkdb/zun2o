import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BEATS_S2 } from '../content/s2/script';
import { CALLS } from '../content/calls';
import { NOTES } from '../content/media';
import { PHOTOS_S2 } from '../content/s2/media';
import { INITIAL_THREADS_S2 } from '../content/s2/threads';
import { ARCHIVE } from '../content/archive';
import { ARCHIVE_LIST_S2 } from '../content/s2/archive';
import { choose, emit, newGame, setSpeed } from './director';
import { getState, initState, setRt, setSave } from './state';
import { isS2 } from '../content/season';

// Season 2 「귀가」: the script holds together, and the night runs from 소연's
// lock screen to 02:00 on the same engine as season 1.

const listens = (ev: string) => BEATS_S2.some((b) => (b.on.endsWith('*') ? ev.startsWith(b.on.slice(0, -1)) : b.on === ev));

describe('season 2 script integrity', () => {
  it('has unique beat ids and only existing calls, threads, notes, photos, records', () => {
    expect(new Set(BEATS_S2.map((b) => b.id)).size).toBe(BEATS_S2.length);
    for (const b of BEATS_S2)
      for (const a of b.actions) {
        if (a.t === 'call') expect(CALLS[a.id], `${b.id} → call ${a.id}`).toBeDefined();
        if (a.t === 'msg' || a.t === 'choice') expect(INITIAL_THREADS_S2[a.th], `${b.id} → thread ${a.th}`).toBeDefined();
        if (a.t === 'note') expect(NOTES[a.id], `${b.id} → note ${a.id}`).toBeDefined();
        if (a.t === 'emit') expect(listens(a.ev), `${b.id} emits ${a.ev}`).toBe(true);
        if (a.t === 'choice') for (const o of a.options) expect(listens(`choice:${a.id}:${o.id}`), `choice ${a.id}:${o.id}`).toBe(true);
      }
    for (const id of ARCHIVE_LIST_S2) expect(ARCHIVE[id], id).toBeDefined();
    expect(ARCHIVE.news3).toBeDefined();
    expect(PHOTOS_S2.filter((p) => p.album === 'hidden')).toHaveLength(3);
  });
});

async function until(cond: () => boolean, maxMs = 600000, step = 250): Promise<void> {
  for (let t = 0; t < maxMs && !cond(); t += step) {
    // pop-ups and calls would wait for a player; this test is the player
    const r = getState().rt;
    if (r.dialog) setRt({ dialog: null });
    if (r.incoming) setRt({ incoming: null });
    if (r.activeCall) setRt({ activeCall: null });
    await vi.advanceTimersByTimeAsync(step);
  }
  if (!cond()) throw new Error('condition never met');
}

describe('season 2 night', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    initState(false);
    // a season-1 player who gave a name and reached an ending
    setSave({ playerName: '지우', endings: ['release'], inputs: ['발신자 정보 없음에게 보낸 메시지 "누구냐고"'] });
    newGame(2);
    setSave({ started: true });
    setSpeed(40);
  });
  afterEach(() => {
    setSpeed(1);
    newGame(1);
    vi.useRealTimers();
  });

  it('starts on 소연\'s phone and remembers last year', () => {
    const s = getState().save;
    expect(isS2()).toBe(true);
    expect(s.season).toBe(2);
    expect(s.s1).toEqual({ name: '지우', endings: ['release'], typed: '누구냐고' });
    expect(s.flags).toEqual(expect.arrayContaining(['s1-name', 's1-typed']));
    expect(s.threads.mom.at(-1)?.text).toContain('두시 전에는');
    expect(s.notes).toContain('s2n4');
  });

  it('runs from the lock screen to 02:00: letter → notebook → recording → name → admin → the copy armed → finale', async () => {
    emit('start');
    setSave({ unlocked: true });
    emit('unlock');
    await until(() => getState().save.chapter === 1);
    emit('note:s2n1');
    emit('photo:s2-n3:dwell');
    await until(() => getState().save.flags.includes('ch2'));
    expect(getState().save.flags).toContain('s2-n3-more');
    emit('memo:s2m1:end');
    await until(() => getState().save.choice?.id === 's2c2');
    // it asks whether last year's name still holds
    expect(getState().save.threads.unknown.some((m) => m.text.includes('작년엔 지우'))).toBe(true);
    choose('same');
    await until(() => getState().save.installed.includes('index'));
    expect(getState().save.chapter).toBe(3);
    emit('admin:unlock');
    await until(() => getState().save.threads.unknown.some((m) => m.text.includes('어머니도 지워져요')));
    emit('admin:armed');
    await until(() => getState().save.flags.includes('copy-armed'));
    await until(() => getState().save.chapter === 4);
    await until(() => (getState().save.liveNote ?? '').startsWith('02:00 — 한'));
    await until(() => getState().rt.finale === true);
    expect(getState().save.liveNote).toBe('02:00 — 한소');
    expect(getState().save.battery).toBe(3);
  });
});
