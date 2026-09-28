import type { Action, AppId, Beat, EndingId, SoundId, ThreadId } from './types';
import { BEATS } from '../content/script';
import { addFlag, appendMessage, fill, flush, getState, hasFlag, newSave, setRt, setSave, wipeSave } from './state';
import { THREAD_META } from '../content/threads';
import { CALLS } from '../content/calls';

// ─────────────────────────────────────────────────────────────────────────
// The director runs the story. emit(event) finds beats listening for it and
// executes their actions in order (waits, typing indicators, calls…).
// Progress through each running sequence is persisted, so a reload in the
// middle of a conversation resumes where it stopped.
// ─────────────────────────────────────────────────────────────────────────

type SoundHook = (id: SoundId) => void;
type LoopHook = (id: 'ring' | 'heartbeat', on: boolean) => void;
let playSound: SoundHook = () => undefined;
let setLoop: LoopHook = () => undefined;
export function connectAudio(play: SoundHook, loop: LoopHook): void {
  playSound = play;
  setLoop = loop;
}
export const sfx = (id: SoundId): void => playSound(id);
export const loop = (id: 'ring' | 'heartbeat', on: boolean): void => setLoop(id, on);

let epoch = 0; // bumps on reset: stale sequences stop
const timers = new Set<ReturnType<typeof setTimeout>>();
let bannerSeq = 1;
let nonce = 1;

/** Speed multiplier for waits (debug fast-forward / automated playtests). */
let speed = 1;
export function setSpeed(x: number): void {
  speed = Math.max(0.05, x);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      timers.delete(t);
      resolve();
    }, ms / speed);
    timers.add(t);
  });
}

/** Visual durations (scares, chapter cards) are never fast-forwarded. */
function sleepReal(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      timers.delete(t);
      resolve();
    }, ms);
    timers.add(t);
  });
}

function matches(pattern: string, ev: string): boolean {
  return pattern.endsWith('*') ? ev.startsWith(pattern.slice(0, -1)) : pattern === ev;
}

function eligible(b: Beat): boolean {
  const s = getState().save;
  if (!b.repeat && (s.doneBeats.includes(b.id) || s.running.some((r) => r.beat === b.id))) return false;
  if (b.requires && !b.requires.every((f) => s.flags.includes(f))) return false;
  if (b.forbids && b.forbids.some((f) => s.flags.includes(f))) return false;
  return true;
}

export function emit(ev: string): void {
  for (const beat of BEATS) {
    if (matches(beat.on, ev) && eligible(beat)) void run(beat, 0);
  }
}

async function run(beat: Beat, from: number): Promise<void> {
  const myEpoch = epoch;
  if (!beat.repeat) {
    setSave((s) => ({ running: [...s.running.filter((r) => r.beat !== beat.id), { beat: beat.id, index: from }] }));
  }
  for (let i = from; i < beat.actions.length; i++) {
    if (myEpoch !== epoch) return;
    if (!beat.repeat) setSave((s) => ({ running: s.running.map((r) => (r.beat === beat.id ? { ...r, index: i } : r)) }));
    await perform(beat.actions[i], myEpoch);
  }
  if (myEpoch !== epoch || beat.repeat) return;
  setSave((s) => ({ running: s.running.filter((r) => r.beat !== beat.id), doneBeats: [...s.doneBeats, beat.id] }));
}

/** Resume sequences interrupted by a reload. */
export function resume(): void {
  const running = getState().save.running;
  for (const r of running) {
    const beat = BEATS.find((b) => b.id === r.beat);
    if (beat) void run(beat, r.index);
  }
  const s = getState().save;
  if (s.flags.includes('finale') && !s.lastEnding && !getState().rt.finale) setRt({ finale: true });
}

// ─── actions ─────────────────────────────────────────────────────────────

function isViewing(th: ThreadId): boolean {
  const rt = getState().rt;
  return rt.app === 'messages' && rt.thread === th;
}

export function showBanner(app: AppId, title: string, body: string, thread?: ThreadId): void {
  const id = bannerSeq++;
  setRt({ banner: { id, app, title, body, thread } });
  sfx('ding');
  vibrate([60]);
  const t = setTimeout(() => {
    timers.delete(t);
    if (getState().rt.banner?.id === id) setRt({ banner: null });
  }, 4200);
  timers.add(t);
}

export function vibrate(pattern: number[]): void {
  try {
    if (!getState().save.reduceFx) navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

function toMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}
function fromMinutes(n: number): string {
  const x = ((n % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
}

async function perform(a: Action, myEpoch: number): Promise<void> {
  switch (a.t) {
    case 'wait':
      await sleep(a.ms);
      return;
    case 'msg': {
      if (a.typing) {
        setRt((r) => ({ typing: { ...r.typing, [a.th]: true } }));
        if (isViewing(a.th)) sfx('type');
        await sleep(a.typing);
        if (myEpoch !== epoch) return;
        setRt((r) => ({ typing: { ...r.typing, [a.th]: false } }));
      }
      const text = fill(a.text);
      appendMessage(a.th, { from: a.from ?? 'them', text, time: getState().save.clock });
      if (isViewing(a.th)) {
        sfx('key');
      } else {
        setSave((s) => ({ unread: { ...s.unread, [a.th]: s.unread[a.th] + 1 } }));
        showBanner('messages', THREAD_META[a.th].name, text, a.th);
      }
      await sleep(350);
      return;
    }
    case 'choice':
      setSave({ choice: { thread: a.th, id: a.id, options: a.options } });
      return;
    case 'notify':
      showBanner(a.app, a.title, a.body, a.open?.thread);
      return;
    case 'flag':
      addFlag(a.f);
      return;
    case 'objective':
      setSave({ objective: { text: a.text, hint: a.hint, since: Date.now() } });
      return;
    case 'chapter':
      setSave({ chapter: a.n });
      setRt({ chapterCard: { n: a.n, title: a.title, nonce: nonce++ } });
      sfx('thud');
      await sleepReal(3000);
      setRt({ chapterCard: null });
      return;
    case 'time':
      setSave({ clock: a.hm });
      if (a.lost) setRt({ lostNonce: nonce++ });
      return;
    case 'battery':
      setSave({ battery: a.v });
      return;
    case 'call':
      if (getState().rt.activeCall || getState().rt.incoming) await sleep(4000);
      setRt({ incoming: a.id });
      loop('ring', true);
      vibrate([400, 200, 400, 200, 400]);
      return;
    case 'scare':
      setRt({ scare: { kind: a.kind, nonce: nonce++ } });
      if (a.kind === 'lunge') {
        sfx('scream');
        vibrate([300, 60, 500]);
      } else sfx('anomaly');
      await sleepReal(a.kind === 'lunge' ? 1300 : 700);
      setRt({ scare: null });
      return;
    case 'glitch':
      setRt({ glitchUntil: Date.now() + a.ms });
      sfx('glitch');
      await sleepReal(a.ms);
      return;
    case 'sound':
      if (a.id === 'heartbeat') loop('heartbeat', true);
      else sfx(a.id);
      return;
    case 'install':
      setSave((s) => ({ installed: s.installed.includes(a.app) ? s.installed : [...s.installed, a.app] }));
      return;
    case 'note':
      setSave((s) => ({ notes: s.notes.includes(a.id) ? s.notes : [...s.notes, a.id] }));
      return;
    case 'shuffle':
      setSave({ shuffled: true });
      return;
    case 'countdown': {
      const end = toMinutes(a.to);
      let cur = Math.max(toMinutes(getState().save.clock), toMinutes(a.from));
      setSave({ clock: fromMinutes(cur) });
      while (cur < end) {
        await sleep(a.stepMs);
        if (myEpoch !== epoch) return;
        cur++;
        setSave((s) => ({ clock: fromMinutes(cur), battery: Math.max(1, s.battery - (cur % 3 === 0 ? 1 : 0)) }));
      }
      return;
    }
    case 'emit':
      emit(a.ev);
      return;
    case 'finale':
      addFlag('finale');
      loop('heartbeat', false);
      setRt({ finale: true, app: null, thread: null });
      return;
    case 'vibrate':
      vibrate(a.ms);
      return;
  }
}

// ─── player-facing commands ──────────────────────────────────────────────

export function choose(optionId: string, input?: string): void {
  const s = getState().save;
  const c = s.choice;
  if (!c) return;
  const opt = c.options.find((o) => o.id === optionId);
  if (!opt) return;
  let reply = opt.reply ?? opt.label;
  if (opt.input === 'name') {
    const name = (input ?? '').replace(/[<>{}]/g, '').trim().slice(0, 12);
    if (!name) return;
    setSave({ playerName: name });
    reply = name;
  }
  if (reply) appendMessage(c.thread, { from: 'me', text: reply, time: s.clock });
  setSave((st) => ({ choice: null, choices: { ...st.choices, [c.id]: optionId } }));
  sfx('key');
  emit(`choice:${c.id}:${optionId}`);
}

export function openApp(app: AppId | null): void {
  const wasInApp = getState().rt.app !== null;
  setRt({ app, thread: null });
  if (app) emit(`app:${app}`);
  else if (wasInApp) maybeReflect();
}

/**
 * The black-mirror trope: going back to the dark home screen, for a quarter
 * of a second, a face that is not yours is reflected in the glass.
 * Twice per playthrough: after the selfie, and during chapter 4.
 */
function maybeReflect(): void {
  const s = getState().save;
  const slot = s.flags.includes('selfie-scare') && !s.flags.includes('refl1') ? 'refl1' : s.flags.includes('ch4') && !s.flags.includes('refl2') ? 'refl2' : null;
  if (!slot || getState().rt.finale) return;
  addFlag(slot);
  const t = setTimeout(() => {
    timers.delete(t);
    setRt({ scare: { kind: 'reflect', nonce: nonce++ } });
    sfx('whisper');
    const t2 = setTimeout(() => {
      timers.delete(t2);
      setRt({ scare: null });
    }, 260);
    timers.add(t2);
  }, 650);
  timers.add(t);
}

export function openThread(th: ThreadId | null): void {
  setRt({ app: 'messages', thread: th });
  if (th) {
    setSave((s) => ({ unread: { ...s.unread, [th]: 0 } }));
    emit(`thread:${th}`);
  }
}

export function answerCall(): void {
  const id = getState().rt.incoming;
  if (!id) return;
  loop('ring', false);
  setRt({ incoming: null, activeCall: id });
  emit(`call:${id}:accept`);
}

export function declineCall(): void {
  const id = getState().rt.incoming;
  if (!id) return;
  loop('ring', false);
  sfx('hangup');
  const label = CALLS[id]?.label ?? id;
  setRt({ incoming: null });
  setSave((s) => ({ calls: [{ who: label, time: s.clock, kind: 'missed' }, ...s.calls] }));
  emit(`call:${id}:decline`);
}

export function startOutgoing(id: string): void {
  setRt({ activeCall: id });
  const label = CALLS[id]?.label ?? id;
  setSave((s) => ({ calls: [{ who: label, time: s.clock, kind: 'out' }, ...s.calls] }));
}

export function endCall(id: string, completed: boolean): void {
  sfx('hangup');
  setRt({ activeCall: null });
  const label = CALLS[id]?.label ?? id;
  if (CALLS[id]?.from !== '1340' && CALLS[id]?.from !== '0200') {
    setSave((s) => ({ calls: [{ who: label, time: s.clock, kind: 'in' }, ...s.calls] }));
  }
  emit(`call:${id}:${completed ? 'end' : 'hangup'}`);
}

export function markPhoto(id: string): void {
  setSave((s) => ({ seenPhotos: s.seenPhotos.includes(id) ? s.seenPhotos : [...s.seenPhotos, id] }));
  emit(`photo:${id}`);
}

export function reachEnding(id: EndingId): void {
  setSave((s) => ({ endings: s.endings.includes(id) ? s.endings : [...s.endings, id], lastEnding: id }));
  flush();
  setRt({ ending: id, finale: false });
}

export function newGame(): void {
  epoch++;
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  loop('ring', false);
  loop('heartbeat', false);
  const s = getState().save;
  wipeSave();
  setSave(newSave({ endings: s.endings, sound: s.sound, reduceFx: s.reduceFx, startedAtReal: Date.now() }));
  flush();
  setRt({
    app: null,
    thread: null,
    typing: {},
    banner: null,
    incoming: null,
    activeCall: null,
    scare: null,
    glitchUntil: 0,
    chapterCard: null,
    finale: false,
    ending: null,
    dialog: null,
    hintOpen: false,
  });
}

export { hasFlag, fromMinutes, toMinutes };
