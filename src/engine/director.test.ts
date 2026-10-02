import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { choose, emit, newGame, sendText, setSpeed } from './director';
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
    expect(first).toBe('야간 출입 기록');
  });

  it("02:00 waits for 도현's last call to finish, however late it was answered", async () => {
    setSave({ flags: ['found-key', 'self-contact'] });
    setSpeed(40);
    emit('ch4');
    await until(() => {
      if (getState().rt.dialog) setRt({ dialog: null });
      return getState().rt.incoming === 'dohyun2';
    });
    // Answered, and the call is still going long after the script's own wait.
    setRt({ incoming: null, activeCall: 'dohyun2' });
    await vi.advanceTimersByTimeAsync(60000);
    expect(getState().rt.finale).toBeFalsy();
    expect(getState().rt.activeCall).toBe('dohyun2');
    setRt({ activeCall: null });
    await until(() => getState().rt.finale === true, 120000);
  });

  it('the opening: she calls two seconds after you pick the phone up, and the riddle is left in writing even if you decline', async () => {
    setSave({ unlocked: false });
    emit('start');
    await vi.advanceTimersByTimeAsync(1500);
    expect(getState().rt.incoming).toBeNull();
    await vi.advanceTimersByTimeAsync(800);
    expect(getState().rt.incoming).toBe('door');
    setRt({ incoming: null });
    emit('call:door:decline');
    await until(() => getState().save.threads.unknown.some((m) => m.text.includes('문 열어 뒀어요')), 20000);
    expect(getState().save.threads.unknown.some((m) => m.text === '받지 그랬어요.')).toBe(true);
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
    await until(() => getState().save.threads.unknown.some((m) => m.text.includes('이름을 적는 사람이요')), 30000);
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

  it('the selfie changes while you look: her far back first, then at 채원\'s cheek — no lunge', async () => {
    setSave({ flags: ['ch3'] });
    expect(getState().save.flags).not.toContain('h05-revealed');
    emit('photo:h05:dwell');
    await vi.advanceTimersByTimeAsync(300);
    expect(getState().save.flags).toContain('h05-far');
    expect(getState().save.flags).not.toContain('h05-revealed');
    await vi.advanceTimersByTimeAsync(3000);
    expect(getState().save.flags).toContain('h05-revealed');
    expect(getState().rt.scare).toBeNull();
  });

  it('messages to 도현 never leave the phone', () => {
    sendText('dohyun', '어디세요');
    const last = getState().save.threads.dohyun.at(-1)!;
    expect(last.failed).toBe(true);
  });

  it('the phone notices you: idle on the lock screen, a smile remembered, typing caught (once each)', async () => {
    setSave({ unlocked: false });
    emit('lock:idle');
    await until(() => getState().save.threads.unknown.some((m) => m.text === '들어오세요.'));
    emit('lock:idle2');
    await until(() => getState().save.threads.unknown.some((m) => m.text === '지금 보고 있죠?'));
    // (the unlock beat sets this flag in play)
    setSave((v) => ({ unlocked: true, flags: [...v.flags, 'unlocked'] }));
    emit('photo:l1');
    await vi.advanceTimersByTimeAsync(200);
    emit('home');
    await until(() => getState().save.threads.unknown.some((m) => m.text === '그때도 이렇게 웃었어요.'));
    // typing before chapter 3: nothing; after: one warning, only once
    emit('typing:unknown');
    await vi.advanceTimersByTimeAsync(5000);
    expect(getState().save.threads.unknown.some((m) => m.text === '그거 보내지 마요.')).toBe(false);
    setSave((s) => ({ flags: [...s.flags, 'ch3'] }));
    emit('typing:unknown');
    emit('typing:unknown');
    await until(() => getState().save.threads.unknown.some((m) => m.text === '그거 보내지 마요.'));
    await vi.advanceTimersByTimeAsync(5000);
    expect(getState().save.threads.unknown.filter((m) => m.text === '그거 보내지 마요.')).toHaveLength(1);
  });

  it('the first blocked text to 도현 is explained once, and it reaches him late when he gets to the school', async () => {
    sendText('dohyun', '폰 주웠어요');
    sendText('dohyun', '거기 어디예요');
    await until(() => getState().save.threads.unknown.some((m) => m.text.includes('도현 씨한테는 안 가요')));
    await vi.advanceTimersByTimeAsync(10000);
    expect(getState().save.threads.unknown.filter((m) => m.text.includes('도현 씨한테는 안 가요'))).toHaveLength(1);
    emit('dohyun:late-text');
    await until(() => getState().save.threads.dohyun.some((m) => m.from === 'them' && m.text.includes('“거기 어디예요”')));
  });
  it('01:55: tell 도현 to stay out and he does — no call from inside, and 채원 is the one still in there', async () => {
    setSave({ flags: ['found-key', 'self-contact'] });
    setSpeed(40);
    emit('ch4');
    await until(() => {
      if (getState().rt.dialog) setRt({ dialog: null });
      return getState().save.choice?.id === 'c4';
    });
    choose('stop');
    await until(() => getState().save.threads.self.some((m) => m.text.includes('나밖에 없어')));
    expect(getState().save.flags).toContain('kept-out');
    expect(getState().save.flags).not.toContain('dohyun-in');
    await until(() => {
      if (getState().rt.dialog) setRt({ dialog: null });
      expect(getState().rt.incoming).not.toBe('dohyun2');
      return getState().rt.finale === true;
    }, 300000);
  });

  it('01:55: say nothing and the question goes away — he goes in, and the call comes from inside', async () => {
    setSave({ flags: ['found-key', 'self-contact'] });
    setSpeed(40);
    emit('ch4');
    await until(() => {
      if (getState().rt.dialog) setRt({ dialog: null });
      return getState().save.choice?.id === 'c4';
    });
    await until(() => getState().save.flags.includes('dohyun-in'));
    expect(getState().save.choice).toBeNull();
    await until(() => getState().rt.incoming === 'dohyun2');
  });
});
