import type { AppId, Attach, ChatMsg, EndingId, S1Summary, ScareKind, Save, ThreadId } from './types';
import { INITIAL_THREADS, INITIAL_UNREAD } from '../content/threads';
import { INITIAL_THREADS_S2, INITIAL_UNREAD_S2 } from '../content/s2/threads';
import { syncSeason } from '../content/season';
import { readItem, removeItem, writeItem } from './storage';
import type { GhostLook } from '../art/Ghost';

// ─────────────────────────────────────────────────────────────────────────
// Game state: a persisted Save (localStorage) + volatile Runtime (what is on
// screen right now). A tiny external store read via useSyncExternalStore.
// ─────────────────────────────────────────────────────────────────────────

const SAVE_KEY = 'phone0200:save';

export interface Banner {
  id: number;
  app: AppId;
  title: string;
  body: string;
  thread?: ThreadId;
}

export interface Runtime {
  app: AppId | null;
  thread: ThreadId | null;
  typing: Partial<Record<ThreadId, boolean>>;
  banner: Banner | null;
  incoming: string | null;
  activeCall: string | null;
  scare: { kind: ScareKind; nonce: number; look?: GhostLook } | null;
  glitchUntil: number;
  chapterCard: { n: number; title: string; nonce: number } | null;
  lostNonce: number;
  finale: boolean;
  ending: EndingId | null;
  dialog: { title: string; body: string } | null;
  /** Text appearing in a reply box by itself. */
  draft: { th: ThreadId; text: string } | null;
  hintOpen: boolean;
  /** A voice memo is playing: scripted pop-ups wait until it ends. */
  memoPlaying: boolean;
  /** Where a tapped chat attachment should land inside the app it opens. */
  deep: Attach | null;
  /** The player is zoomed into a photo, editing it, or typing: hold scripted pop-ups. */
  engaged: boolean;
  /** The phone is restarting by itself. */
  rebooting: boolean;
  /** For a split second the status-bar clock reads something else. */
  clockGlitch: string | null;
  /** The screen dips in brightness on its own. */
  dip: boolean;
  /** For a moment an app on the home screen has another name, or isn't there at all. */
  appGlitch: { app: AppId; name: string } | null;
  vanishApp: AppId | null;
  audioReady: boolean;
  debug: boolean;
  /** The 0200 call from 23:53 that never hung up: its screen is open. */
  openLine: boolean;
  /** Where on the home screen the open app's icon was (its zoom starts there). */
  appOrigin: string | null;
}

export interface State {
  save: Save;
  rt: Runtime;
}

export function newSave(keep?: Partial<Save>): Save {
  return {
    v: 2,
    started: false,
    unlocked: false,
    chapter: 0,
    flags: [],
    doneBeats: [],
    running: [],
    threads: structuredClone(INITIAL_THREADS),
    unread: { ...INITIAL_UNREAD },
    choice: null,
    choices: {},
    objective: null,
    clock: '23:51',
    battery: 12,
    installed: [],
    notes: ['n6', 'n1', 'n2', 'n3', 'n5'],
    seenPhotos: [],
    calls: [
      { who: '엄마', time: '23:12', kind: 'missed', count: 6 },
      { who: '도현', time: '03:10', kind: 'missed', count: 14 },
      { who: '0200', time: '02:00', kind: 'in' },
    ],
    playerName: null,
    startedAtReal: Date.now(),
    endings: [],
    lastEnding: null,
    shuffled: false,
    sound: true,
    reduceFx: false,
    passcodeFails: 0,
    photos: [],
    memos: ['m1'],
    inputs: [],
    nudged: [],
    ...keep,
  };
}

/** Season 2's opening state: 소연's phone, a year later. */
export function newSave2(s1: S1Summary | undefined, keep?: Partial<Save>): Save {
  return newSave({
    season: 2,
    s1,
    threads: structuredClone(INITIAL_THREADS_S2),
    unread: { ...INITIAL_UNREAD_S2 },
    notes: ['s2n2', 's2n3', ...(s1 ? ['s2n4'] : []), 's2n1'],
    calls: [
      { who: '엄마', time: '23:48', kind: 'missed', count: 9 },
      { who: '채원', time: '23:46', kind: 'missed', count: 4 },
    ],
    memos: [],
    // what it remembers of you, as flags the beats can read
    flags: [...(s1?.name ? ['s1-name'] : []), ...(s1?.typed ? ['s1-typed'] : [])],
    ...keep,
  });
}

/** What season 2 keeps of a season-1 save. */
export function summarizeS1(s: Save): S1Summary {
  const typed = [...s.inputs].reverse().map((e) => /(?:(?:발신자 정보 없음)에게|나에게) 보낸 메시지 "(.+)"$/.exec(e)?.[1]).find(Boolean) ?? null;
  return { name: s.playerName, endings: s.endings.filter((e) => !e.startsWith('s2-')), typed };
}

function isSave(x: unknown): x is Save {
  if (!x || typeof x !== 'object') return false;
  const s = x as Partial<Save>;
  return (
    s.v === 2 &&
    Array.isArray(s.flags) &&
    Array.isArray(s.doneBeats) &&
    Array.isArray(s.running) &&
    typeof s.threads === 'object' &&
    s.threads !== null &&
    ['dohyun', 'mom', 'self', 'unknown'].every((t) => Array.isArray((s.threads as Record<string, unknown>)[t])) &&
    typeof s.clock === 'string'
  );
}

function loadSave(): Save {
  const text = readItem(SAVE_KEY);
  if (!text) return newSave();
  try {
    const parsed: unknown = JSON.parse(text);
    // Merge over defaults so an older save missing a field still works.
    if (!isSave(parsed)) return newSave();
    const save = { ...newSave(), ...parsed };
    // Saves from before the photo changed only after the scare: she's already been seen.
    if (save.flags.includes('reveal-scare') && !save.flags.includes('p07-revealed') && !save.running.some((r) => r.beat === 'reveal')) {
      save.flags = [...save.flags, 'p07-revealed'];
    }
    if (save.flags.includes('selfie-scare') && !save.flags.includes('h05-revealed') && !save.running.some((r) => r.beat === 'selfie')) {
      save.flags = [...save.flags, 'h05-revealed'];
    }
    return save;
  } catch {
    return newSave();
  }
}

const initialRuntime = (debug: boolean): Runtime => ({
  app: null,
  thread: null,
  typing: {},
  banner: null,
  incoming: null,
  activeCall: null,
  scare: null,
  glitchUntil: 0,
  chapterCard: null,
  lostNonce: 0,
  finale: false,
  ending: null,
  dialog: null,
  draft: null,
  hintOpen: false,
  memoPlaying: false,
  deep: null,
  engaged: false,
  rebooting: false,
  clockGlitch: null,
  dip: false,
  appGlitch: null,
  vanishApp: null,
  audioReady: false,
  debug,
  openLine: false,
  appOrigin: null,
});

let state: State = { save: newSave(), rt: initialRuntime(false) };
const listeners = new Set<() => void>();
let persistTimer: ReturnType<typeof setTimeout> | null = null;

export function initState(debug: boolean): void {
  state = { save: loadSave(), rt: initialRuntime(debug) };
  syncSeason(state.save.season);
}

export const getState = (): State => state;

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function notify(): void {
  listeners.forEach((l) => l());
}

export function setSave(patch: Partial<Save> | ((s: Save) => Partial<Save>)): void {
  const p = typeof patch === 'function' ? patch(state.save) : patch;
  state = { ...state, save: { ...state.save, ...p } };
  // the season has to be right before anyone re-renders
  if ('season' in p || 'v' in p) syncSeason(state.save.season);
  notify();
  schedulePersist();
}

export function setRt(patch: Partial<Runtime> | ((r: Runtime) => Partial<Runtime>)): void {
  const p = typeof patch === 'function' ? patch(state.rt) : patch;
  state = { ...state, rt: { ...state.rt, ...p } };
  notify();
}

function schedulePersist(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    flush();
  }, 300);
}

export function flush(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  writeItem(SAVE_KEY, JSON.stringify(state.save));
}

export function wipeSave(): void {
  removeItem(SAVE_KEY);
}

export function logInput(entry: string): void {
  setSave((s) => ({ inputs: [...s.inputs, entry].slice(-12) }));
}

const CHECKPOINT_KEY = 'phone0200:checkpoint';
/** Saved right before 02:00 so the finale can be replayed for other endings. */
export function saveCheckpoint(): void {
  writeItem(CHECKPOINT_KEY, JSON.stringify(state.save));
}
export function clearCheckpoint(): void {
  removeItem(CHECKPOINT_KEY);
}
export function loadCheckpoint(): Save | null {
  const t = readItem(CHECKPOINT_KEY);
  if (!t) return null;
  try {
    const p: unknown = JSON.parse(t);
    return isSave(p) ? { ...newSave(), ...p } : null;
  } catch {
    return null;
  }
}

// ─── small helpers used by UI and director ───────────────────────────────

export const hasFlag = (f: string): boolean => state.save.flags.includes(f);

export function addFlag(f: string): void {
  if (!hasFlag(f)) setSave((s) => ({ flags: [...s.flags, f] }));
}

let msgSeq = 0;
export function appendMessage(th: ThreadId, msg: Omit<ChatMsg, 'id'>): void {
  const full: ChatMsg = { ...msg, id: `m${Date.now().toString(36)}${msgSeq++}` };
  setSave((s) => ({ threads: { ...s.threads, [th]: [...s.threads[th], full] } }));
}

/** Replace {placeholders} using local save data only. */
export function fill(text: string): string {
  if (!text.includes('{')) return text;
  const s = state.save;
  const start = new Date(s.startedAtReal);
  const values: Record<string, string> = {
    name: s.playerName ?? '방문자님',
    start: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
    photos: String(s.seenPhotos.length),
    memos: s.flags.includes('memo-done') ? '1' : '0',
    // The player's real local time — the one thing the phone should not know.
    real: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
    clock: s.clock,
    toDohyun: s.choices.toDohyun ?? '',
    s1name: s.s1?.name ?? '(이름 없음)',
    // the first letter of your name (or of "당신")
    initial: (s.playerName ?? s.s1?.name ?? '당신').slice(0, 1),
    typed1: s.s1?.typed ?? '',
  };
  return text.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);
}
