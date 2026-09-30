import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emit, newGame, sendText, setSpeed } from './director';
import { getState, initState, setRt, setSave } from './state';

// The director's timing rules, checked on the real story script with fake
// timers: scripted pop-ups never cover what the player is doing, and one
// event never triggers two branches.

async function until(cond: () => boolean, maxMs = 600000, step = 250): Promise<void> {
  for (let t = 0; t < maxMs && !cond(); t += step) await vi.advanceTimersByTimeAsync(step);
  if (!cond()) throw new Error('condition never met');
}

beforeEach(() => {
  vi.useFakeTimers();
  initState(false);
  newGame();
  setSave({ started: true, unlocked: true });
});

afterEach(() => {
  setSpeed(1);
  vi.useRealTimers();
});

describe('director timing', () => {
  it('holds the chapter-4 battery dialog while the player is zoomed into a photo', async () => {
    setSave({ flags: ['found-key', 'self-contact'] });
    setSpeed(40);
    setRt({ engaged: true });
    emit('ch4');
    await until(() => getState().save.battery === 4);
    await vi.advanceTimersByTimeAsync(5000);
    expect(getState().rt.dialog).toBeNull();
    setRt({ engaged: false });
    await vi.advanceTimersByTimeAsync(1000);
    expect(getState().rt.dialog?.title).toBe('배터리 부족');
  });

  it('never drops a pop-up over a call in progress: the night waits for the call', async () => {
    setSave({ flags: ['found-key', 'self-contact'] });
    setSpeed(40);
    setRt({ activeCall: 'radio' });
    emit('ch4');
    await vi.advanceTimersByTimeAsync(60000);
    expect(getState().rt.banner).toBeNull();
    expect(getState().rt.dialog).toBeNull();
    expect(getState().save.installed).toContain('index');
    setRt({ activeCall: null });
    // The held notification is the first thing to appear once the call ends.
    let first: string | undefined;
    for (let i = 0; i < 400 && !first; i++) {
      await vi.advanceTimersByTimeAsync(25);
      first = getState().rt.banner?.title;
    }
    expect(first).toBe('야간 색인');
  });

  it('one decline of 도현 triggers exactly one reaction', async () => {
    setSpeed(20);
    emit('call:dohyun1:decline');
    await until(() => getState().save.threads.dohyun.some((m) => m.text.includes('받아 주세요')));
    await vi.advanceTimersByTimeAsync(3000);
    expect(getState().save.threads.dohyun.some((m) => m.text.includes('그럼 이것만'))).toBe(false);
  });

  it('free text: the unknown number pauses, then answers — and remembers being asked', async () => {
    sendText('unknown', '너 누구야?');
    await until(() => getState().save.threads.unknown.some((m) => m.text === '정말 몰라요?'), 30000);
    expect(getState().save.talk?.['unknown:who']).toBe(1);
    await vi.advanceTimersByTimeAsync(5000);
    sendText('unknown', '누구냐니까');
    await until(() => getState().save.threads.unknown.some((m) => m.text.includes('기록하는 사람이요')), 30000);
  });

  it('silent players are told about story sounds (소리 인식)', async () => {
    setSave({ sound: false, flags: ['selfie-scare'] });
    setSpeed(40);
    emit('choice:c3:finder');
    let seen = false;
    for (let i = 0; i < 4000 && !seen; i++) {
      await vi.advanceTimersByTimeAsync(25);
      seen = getState().rt.banner?.title === '소리 인식';
    }
    expect(seen).toBe(true);
  });

  it('the dark photo: empty room for a second, the scare, and only then is she in the photo', async () => {
    emit('photo:p07:reveal');
    await vi.advanceTimersByTimeAsync(1000);
    expect(getState().rt.scare).toBeNull();
    expect(getState().save.flags).not.toContain('p07-revealed');
    await vi.advanceTimersByTimeAsync(400);
    expect(getState().rt.scare?.kind).toBe('lunge');
    expect(getState().save.flags).toContain('p07-revealed');
  });

  it('messages to 도현 never leave the phone', () => {
    sendText('dohyun', '어디세요');
    const last = getState().save.threads.dohyun.at(-1)!;
    expect(last.failed).toBe(true);
  });
});
