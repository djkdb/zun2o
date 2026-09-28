import type { Action, AppId, Attach, Beat, EndingId, SoundId, ThreadId } from './types';
import { BEATS } from '../content/script';
import { addFlag, appendMessage, fill, flush, getState, hasFlag, loadCheckpoint, logInput, newSave, saveCheckpoint, setRt, setSave, wipeSave } from './state';
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
type MixHook = (ambience: number, drone: number, seconds: number, brightness: number) => void;
let playSound: SoundHook = () => undefined;
let setLoop: LoopHook = () => undefined;
let setMix: MixHook = () => undefined;
export function connectAudio(play: SoundHook, loop: LoopHook, mixer: MixHook): void {
  playSound = play;
  setLoop = loop;
  setMix = mixer;
}

/** Room tone / drone per chapter: the phone gets louder inside as the night goes on. */
const CHAPTER_MIX: Record<number, [number, number, number]> = {
  0: [0.1, 0, 420],
  1: [0.16, 0.03, 420],
  2: [0.2, 0.08, 480],
  3: [0.24, 0.16, 700],
  4: [0.16, 0.34, 900],
  5: [0, 0, 420],
};
export function applyChapterMix(seconds = 3): void {
  const [a, d, b] = CHAPTER_MIX[getState().save.chapter] ?? CHAPTER_MIX[0];
  setMix(a, d, seconds, b);
}
export function mix(ambience: number, drone: number, seconds: number, brightness = 420): void {
  setMix(ambience, drone, seconds, brightness);
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
  // Decide the targets first: a beat's own flags must not make a sibling
  // beat eligible within the same event (e.g. "declined once" → "twice").
  const targets = BEATS.filter((beat) => matches(beat.on, ev) && eligible(beat));
  targets.forEach((beat) => void run(beat, 0));
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
  // Nothing drops over a recording that is playing; the unread badge is enough.
  if (getState().rt.memoPlaying) return;
  const id = bannerSeq++;
  setRt({ banner: { id, app, title, body, thread } });
  sfx('ding');
  vibrate([60]);
  const t = setTimeout(() => {
    timers.delete(t);
    if (getState().rt.banner?.id === id) setRt({ banner: null });
  }, 3200);
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

/** Never cover what the player is listening to: hold pop-ups during memos and calls. */
async function whenFree(myEpoch: number): Promise<void> {
  // Hard busy: a recording, a call, a dialog already up — always wait.
  // Soft busy: the player is zooming, editing or typing — wait, but at most
  // ~20 s so the night keeps moving.
  const hard = () => {
    const r = getState().rt;
    return r.memoPlaying || r.activeCall !== null || r.incoming !== null || r.dialog !== null;
  };
  const t0 = Date.now();
  while (myEpoch === epoch && (hard() || (getState().rt.engaged && Date.now() - t0 < 20000))) await sleepReal(400);
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
      appendMessage(a.th, { from: a.from ?? 'them', text, time: getState().save.clock, ...(a.attach ? { attach: a.attach } : {}) });
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
      await whenFree(myEpoch);
      showBanner(a.app, a.title, a.body, a.open?.thread);
      return;
    case 'flag':
      addFlag(a.f);
      return;
    case 'objective':
      setSave({ objective: { text: a.text, hint: a.hint, since: Date.now(), nudge: a.nudge } });
      setRt({ hintOpen: false });
      return;
    case 'chapter':
      setSave({ chapter: a.n });
      applyChapterMix();
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
      await whenFree(myEpoch);
      if (myEpoch !== epoch) return;
      setRt({ incoming: a.id });
      loop('ring', true);
      vibrate([400, 200, 400, 200, 400]);
      {
        // Nobody answers forever: after ~15 s it becomes a missed call.
        const id = a.id;
        const t = setTimeout(() => {
          timers.delete(t);
          if (getState().rt.incoming === id) missCall();
        }, 15000);
        timers.add(t);
      }
      return;
    case 'scare':
      setRt({ scare: { kind: a.kind, nonce: nonce++, look: a.look } });
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
      saveCheckpoint();
      addFlag('finale');
      loop('heartbeat', false);
      loop('ring', false);
      setRt({ incoming: null, activeCall: null, dialog: null });
      setRt({ finale: true, app: null, thread: null });
      return;
    case 'vibrate':
      vibrate(a.ms);
      return;
    case 'unsend':
      // Someone deletes a message you already read.
      setSave((s) => ({
        threads: {
          ...s.threads,
          [a.th]: s.threads[a.th].map((m) => (m.text.includes(a.match) ? { ...m, text: '메시지가 삭제되었습니다.', from: 'system' as const } : m)),
        },
      }));
      sfx('glitch');
      return;
    case 'dialog':
      await whenFree(myEpoch);
      setRt({ dialog: { title: a.title, body: fill(a.body) } });
      sfx('error');
      return;
    case 'hush':
      // The silence right before something happens.
      setMix(0, 0, 0.05, 420);
      await sleepReal(a.ms);
      applyChapterMix(0.4);
      return;
    case 'calllog':
      setSave((s) => ({ calls: [a.entry, ...s.calls] }));
      return;
    case 'photo':
      setSave((s) => ({ photos: s.photos.includes(a.id) ? s.photos : [...s.photos, a.id] }));
      return;
    case 'memo':
      setSave((s) => ({ memos: s.memos.includes(a.id) ? s.memos : [...s.memos, a.id] }));
      return;
    case 'draft': {
      // Someone types into the reply box… and deletes it.
      const text = fill(a.text);
      for (let i = 1; i <= text.length; i++) {
        if (myEpoch !== epoch) return;
        setRt({ draft: { th: a.th, text: text.slice(0, i) } });
        if (isViewing(a.th)) sfx('key');
        await sleepReal(170);
      }
      await sleepReal(1400);
      for (let i = text.length - 1; i >= 0; i--) {
        if (myEpoch !== epoch) return;
        setRt({ draft: i ? { th: a.th, text: text.slice(0, i) } : null });
        await sleepReal(60);
      }
      return;
    }
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
    logInput(`이름 “${name}”`);
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

/** Tapping a shared photo / recording / link in a chat opens it in place. */
export function openAttach(a: Attach): void {
  sfx('click');
  setRt({ deep: a, app: a.kind === 'memo' ? 'memos' : a.kind === 'archive' ? 'browser' : 'gallery', thread: null });
  emit(`app:${a.kind === 'memo' ? 'memos' : a.kind === 'archive' ? 'browser' : 'gallery'}`);
}

/** Consumed by the app that was opened from an attachment. */
export function takeDeep(): Attach | null {
  const d = getState().rt.deep;
  if (d) setRt({ deep: null });
  return d;
}

let lastReply = 0;
let silentUntil = 0;
/**
 * The player can always type. 도현 and 엄마 never receive it (no network);
 * 02:00 and 채원 answer — usually with whatever the story is waiting for.
 */
export function sendText(th: ThreadId, raw: string): void {
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, 80);
  if (!text) return;
  const time = getState().save.clock;
  logInput(`${THREAD_META[th].name}에게 보낸 메시지 "${text}"`);
  if (th === 'dohyun' || th === 'mom') {
    appendMessage(th, { from: 'me', text, time, failed: true });
    sfx('error');
    return;
  }
  appendMessage(th, { from: 'me', text, time });
  sfx('send');
  const now = Date.now();
  const s = getState().save;
  // Before 채원 is reachable, "나에게" is just a notepad.
  if (th === 'self' && !s.flags.includes('selfie-scare')) return;
  // Her real name, sent to her: she starts to answer… and stops. Then silence.
  if (th === 'unknown' && /서\s*미\s*령|미령/.test(text) && !s.flags.includes('named-her')) {
    addFlag('named-her');
    silentUntil = now + 90000;
    const myEpoch0 = epoch;
    void (async () => {
      await sleep(1200);
      if (myEpoch0 !== epoch) return;
      setRt((r) => ({ typing: { ...r.typing, unknown: true } }));
      await sleepReal(3200);
      setRt((r) => ({ typing: { ...r.typing, unknown: false } }));
      sfx('glitch');
    })();
    return;
  }
  if (th === 'unknown' && now < silentUntil) return;
  if (now - lastReply < 5000 || getState().rt.typing[th]) return;
  lastReply = now;
  const reply = pickReply(th, text);
  const myEpoch = epoch;
  void (async () => {
    await sleep(900 + Math.random() * 900);
    if (myEpoch !== epoch) return;
    await perform({ t: 'msg', th, text: reply, typing: 1200 + reply.length * 40, ...(th === 'self' ? { from: 'me' as const } : {}) }, myEpoch);
  })();
}

function pickReply(th: ThreadId, text: string): string {
  const s = getState().save;
  const rules: [RegExp, string][] =
    th === 'unknown'
      ? [
          [/누구|정체|뭐야|who/i, '기록하는 사람이요. 채원 씨 다음 사람을 기다리고 있어요.'],
          [/경찰|신고|112/, '경찰은 이미 왔다 갔어요. 3층엔 아무도 없었죠.'],
          [/살려|도와|제발/, '여기선 아무도 못 도와줘요, {name}.'],
          [/채원/, '채원 씨는 근무 대기 중이에요. 조용히 해 줘요.'],
          [/끄|꺼|전원/, '끄지 마세요.'],
          [/무서|싫어|그만/, '괜찮아요. 처음엔 다 그래요.'],
          [/몇 ?시|시간/, '이 폰은 {clock}. 당신 쪽은 {real}.'],
          [/haewon|열쇠|0200-?/i, '그 단어, 여기 쓰지 마요.'],
          [/1340|라디오|방송/, '그 방송은 듣지 마요. 숫자를 세다 보면 이름이 나와요.'],
          [/서미령|미령/, '…'],
        ]
      : [
          [/누구|정체/, '나 윤채원이야. 이 폰 주인. 제발 장난 아니야'],
          [/어디|위치/, '3층. 02호실. 근데 문이 없어. 서랍만 있어'],
          [/경찰|신고|112/, '신고해도 여기 못 와. 도현이도 왔었는데 날 못 봤대'],
          [/괜찮|다쳤/, '안 괜찮아. 추워. 누가 계속 내 이름을 적어'],
          [/그 여자|귀신|누가/, '보지 마. 사진으로 보면 더 가까이 와'],
          [/서미령|미령/, '그 이름… 서랍 카드에 있었어. 첫 번째 근무자. 그 여자가 그 이름만 나오면 멈춰'],
          [/haewon|열쇠/i, '그거야. 그걸로 색인을 끝낼 수 있어. 두 시에 써'],
          [/1340|라디오|방송/, '그 숫자 방송… 순서가 있어. 001 003 007'],
        ];
  for (const [re, line] of rules) if (re.test(text)) return line;
  // Otherwise: whatever the story is waiting for, from whoever would say it.
  const nudge = s.objective?.nudge;
  if (nudge && nudge.th === th) return nudge.text;
  const pool =
    th === 'unknown'
      ? ['대답은 나중에 해도 돼요.', '천천히 해요. 두 시까지는 시간 있어요.', '{name}, 지금 그게 중요한 게 아니에요.', '…다 적어 두고 있어요.']
      : ['빨리. 시간 없어', '나 보여? 거기서 나 보여?', '그 여자가 듣고 있어. 짧게 보내'];
  return pool[Math.floor(Math.random() * pool.length)];
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

function missCall(): void {
  const id = getState().rt.incoming;
  if (!id) return;
  loop('ring', false);
  const label = CALLS[id]?.label ?? id;
  setRt({ incoming: null });
  setSave((s) => ({ calls: [{ who: label, time: s.clock, kind: 'missed' }, ...s.calls] }));
  // Letting it ring out counts as not picking up.
  emit(`call:${id}:decline`);
  emit(`call:${id}:missed`);
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
    draft: null,
    hintOpen: false,
  });
}

/** Replay the 02:00 finale from the checkpoint (for the other endings). */
export function replayFinale(): boolean {
  const cp = loadCheckpoint();
  if (!cp) return false;
  epoch++;
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  setSave({ ...cp, endings: getState().save.endings, lastEnding: null, running: [], flags: [...cp.flags.filter((f) => f !== 'finale'), 'finale'] });
  flush();
  setRt({ ending: null, finale: true, app: null, thread: null, scare: null, dialog: null, incoming: null, activeCall: null });
  return true;
}

// ─── the phone keeps living between beats ─────────────────────────────────

/** Minutes on a night axis starting at noon, so 23:51 < 00:30. */
const night = (hm: string) => (toMinutes(hm) + 720) % 1440;
const CLOCK_CAP: Record<number, string> = { 0: '23:59', 1: '00:30', 2: '01:11', 3: '01:49' };

/**
 * One slow tick: the clock creeps forward (never past the chapter's next
 * scripted time), the battery drains, and a character nudges a stuck player.
 */
export function startLifeTicker(): () => void {
  let n = 0;
  const iv = setInterval(() => {
    const { save: s, rt } = getState();
    if (!s.started || rt.finale || rt.ending) return;
    n++;
    const cap = CLOCK_CAP[s.chapter];
    if (s.unlocked && cap && n % 5 === 0 && night(s.clock) < night(cap)) {
      setSave({ clock: fromMinutes(toMinutes(s.clock) + 1) });
    }
    if (s.unlocked && n % 36 === 0 && s.battery > 7 && s.chapter < 4) setSave({ battery: s.battery - 1 });
    const o = s.objective;
    if (o?.nudge && !s.nudged.includes(o.text) && Date.now() - o.since > 80000 && !rt.activeCall && !rt.incoming) {
      setSave({ nudged: [...s.nudged, o.text] });
      void perform({ t: 'msg', th: o.nudge.th, text: o.nudge.text, from: o.nudge.from, typing: 1500 }, epoch);
    }
  }, 5000);
  return () => clearInterval(iv);
}

/** Player left the app and came back after a while: the phone locked itself. */
export function onReturn(awayMs: number): void {
  const { save: s, rt } = getState();
  if (!s.started || !s.unlocked || rt.finale || rt.ending || rt.activeCall || rt.incoming || awayMs < 20000) return;
  setSave({ unlocked: false });
  setRt({ app: null, thread: null });
  void perform({ t: 'msg', th: 'unknown', text: '어디 갔었어요?' }, epoch);
}

export { hasFlag, fromMinutes, toMinutes };
