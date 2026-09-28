import { describe, expect, it } from 'vitest';
import { BEATS } from '../content/script';
import { CALLS } from '../content/calls';
import { NOTES, PHOTOS } from '../content/media';
import { INITIAL_THREADS } from '../content/threads';
import { ARCHIVE, ARCHIVE_LIST, ARCHIVE_SEQUENCE } from '../content/archive';

describe('story script integrity', () => {
  it('has unique beat ids', () => {
    expect(new Set(BEATS.map((b) => b.id)).size).toBe(BEATS.length);
  });

  it('references only existing calls, threads, notes', () => {
    for (const b of BEATS)
      for (const a of b.actions) {
        if (a.t === 'call') expect(CALLS[a.id], `${b.id} → call ${a.id}`).toBeDefined();
        if (a.t === 'msg' || a.t === 'choice') expect(INITIAL_THREADS[a.th], `${b.id} → thread ${a.th}`).toBeDefined();
        if (a.t === 'note') expect(NOTES[a.id], `${b.id} → note ${a.id}`).toBeDefined();
      }
  });

  it('every emitted event has a listener', () => {
    const listens = (ev: string) => BEATS.some((b) => (b.on.endsWith('*') ? ev.startsWith(b.on.slice(0, -1)) : b.on === ev));
    for (const b of BEATS) for (const a of b.actions) if (a.t === 'emit') expect(listens(a.ev), `${b.id} emits ${a.ev}`).toBe(true);
  });

  it('every choice option has a follow-up beat', () => {
    const listens = (ev: string) => BEATS.some((b) => (b.on.endsWith('*') ? ev.startsWith(b.on.slice(0, -1)) : b.on === ev));
    for (const b of BEATS)
      for (const a of b.actions)
        if (a.t === 'choice') for (const o of a.options) expect(listens(`choice:${a.id}:${o.id}`), `choice ${a.id}:${o.id}`).toBe(true);
  });

  it('the main path is reachable: start → unlock → … → finale', () => {
    const chain = ['start', 'unlock', 'thread:unknown', 'c1:done', 'photo:p07', 'photo:p07:reveal', 'call1:done', 'memo:m1:end', 'c2:done', 'album:unlock', 'photo:h05:dwell', 'thread:self', 'browser:r013', 'ch4'];
    for (const ev of chain) expect(BEATS.some((b) => b.on === ev || (b.on.endsWith('*') && ev.startsWith(b.on.slice(0, -1)))), ev).toBe(true);
    expect(BEATS.find((b) => b.id === 'ch4')?.actions.some((a) => a.t === 'finale')).toBe(true);
  });

  it('content is consistent', () => {
    expect(PHOTOS.filter((p) => p.album === 'hidden').length).toBe(5);
    for (const id of [...ARCHIVE_LIST, ...ARCHIVE_SEQUENCE, 'r013', 'news']) expect(ARCHIVE[id]).toBeDefined();
  });
});
