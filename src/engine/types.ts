// ─────────────────────────────────────────────────────────────────────────
// 12% — shared types.
// The story is data (content/script.ts): beats listen for events and run
// actions. The director (engine/director.ts) executes them, persists
// progress and resumes half-finished sequences after a reload.
// ─────────────────────────────────────────────────────────────────────────

export type AppId = 'messages' | 'gallery' | 'notes' | 'memos' | 'browser' | 'phone' | 'settings' | 'index';
export type ThreadId = 'dohyun' | 'mom' | 'unknown' | 'self';
export type EndingId = 'poweroff' | 'shift' | 'release' | 's2-daughter' | 's2-instead' | 's2-home';

/** What season 2 remembers of you from season 1. */
export interface S1Summary {
  name: string | null;
  endings: EndingId[];
  /** One thing you typed to her last year. */
  typed: string | null;
}

export type SoundId =
  | 'click'
  | 'hover'
  | 'error'
  | 'transition'
  | 'unlock'
  | 'anomaly'
  | 'event'
  | 'ending'
  | 'whisper'
  | 'type'
  | 'thud'
  | 'scream'
  | 'ding'
  | 'key'
  | 'static'
  | 'heartbeat'
  | 'footsteps'
  | 'drawer'
  | 'glitch'
  | 'hangup'
  | 'send'
  | 'knock'
  | 'creak'
  | 'drip'
  | 'breath'
  | 'stepsAbove'
  | 'open'
  | 'zoom'
  | 'connect'
  | 'tape'
  | 'vault'
  | 'inhale'
  | 'buzz'
  | 'impact'
  | 'tinnitus';

export interface ChatMsg {
  id: string;
  from: 'them' | 'me' | 'system';
  text: string;
  /** Display time HH:MM (game clock at delivery, or scripted). */
  time: string;
  /** Day label for history messages ("9월 26일"). */
  day?: string;
  /** A photo / recording / link shared in the chat — tap to open it. */
  attach?: Attach;
  /** The player's text that never left the phone. */
  failed?: boolean;
  /** 나에게, sent from inside (채원 / 소연 on the phone you're holding) — not by you. */
  inside?: boolean;
}

export type Attach =
  | { kind: 'photo'; id: string }
  | { kind: 'memo'; id: string }
  | { kind: 'album' }
  | { kind: 'archive' };

export interface ChoiceOption {
  id: string;
  label: string;
  /** Free-text input instead of a fixed reply. Stored locally only. */
  input?: 'name';
  /** What the player "sends". Defaults to label. Empty = silent. */
  reply?: string;
}

export interface PendingChoice {
  thread: ThreadId;
  id: string;
  options: ChoiceOption[];
}

/** A character texts a stuck player (in-world hint). */
export interface Nudge {
  th: ThreadId;
  text: string;
  from?: 'them' | 'me';
}

/** `turn`: you look behind you — the screen is the dark glass you're holding, and for a moment it isn't empty. */
export type ScareKind = 'lunge' | 'peek' | 'flash' | 'reflect' | 'turn';

export type Action =
  | { t: 'wait'; ms: number }
  | { t: 'msg'; th: ThreadId; text: string; from?: 'them' | 'me' | 'system'; typing?: number; attach?: Attach }
  | { t: 'choice'; th: ThreadId; id: string; options: ChoiceOption[] }
  | { t: 'notify'; app: AppId; title: string; body: string; open?: { thread?: ThreadId } }
  | { t: 'flag'; f: string }
  | { t: 'objective'; text: string; hint: string; nudge?: Nudge; app?: AppId }
  | { t: 'chapter'; n: number; title: string }
  | { t: 'time'; hm: string; lost?: boolean }
  | { t: 'battery'; v: number }
  | { t: 'call'; id: string }
  | { t: 'scare'; kind: ScareKind; look?: 'face' | 'hang' | 'profile' | 'curtain' }
  | { t: 'glitch'; ms: number }
  /** `caption`: shown as a "소리 인식" notice when the player has sound off. */
  | { t: 'sound'; id: SoundId; caption?: string }
  | { t: 'install'; app: AppId }
  | { t: 'note'; id: string }
  | { t: 'shuffle' }
  | { t: 'countdown'; from: string; to: string; stepMs: number }
  | { t: 'emit'; ev: string }
  | { t: 'finale' }
  | { t: 'unsend'; th: ThreadId; match: string }
  | { t: 'dialog'; title: string; body: string }
  | { t: 'draft'; th: ThreadId; text: string }
  /** The phone restarts by itself and comes back locked, with a new wallpaper. */
  | { t: 'reboot'; wallpaper: 'annex' | 'booth' }
  /** `still`: no warning breath — just silence, then it happens. */
  | { t: 'hush'; ms: number; still?: boolean }
  | { t: 'photo'; id: string }
  | { t: 'memo'; id: string }
  | { t: 'calllog'; entry: CallLogEntry }
  | { t: 'vibrate'; ms: number[] }
  /** Someone starts typing… and sends nothing. */
  | { t: 'typing'; th: ThreadId; ms: number }
  /** a question left unanswered goes away (only if it is still that one) */
  | { t: 'unchoice'; id: string }
  /** Someone else's hand writes into the notes app, a character at a time. */
  | { t: 'write'; text: string; ms: number };

export interface Beat {
  id: string;
  /** Event name. A trailing '*' matches any suffix. */
  on: string;
  requires?: string[];
  forbids?: string[];
  /** Can fire every time (default: once per playthrough). */
  repeat?: boolean;
  actions: Action[];
}

export interface CallLine {
  at: number;
  who: 'caller' | 'other' | 'sfx';
  text: string;
  /** Speak with speechSynthesis (subtitles are always shown). */
  voice?: 'male' | 'female' | 'entity';
}

export interface CallScript {
  id: string;
  from: string;
  /** Contact label on the incoming-call screen. */
  label: string;
  video?: boolean;
  lines: CallLine[];
  /** Choice shown at `choiceAt` ms; the call pauses until answered. */
  choice?: { at: number; options: { id: string; label: string }[] };
  after?: CallLine[];
  /** What follows depends on what you said (falls back to `after`). */
  afterBy?: Record<string, CallLine[]>;
  duration: number;
}

export interface CallLogEntry {
  who: string;
  time: string;
  kind: 'missed' | 'in' | 'out';
  count?: number;
  duration?: string;
}

export interface Save {
  v: 2;
  started: boolean;
  unlocked: boolean;
  chapter: number;
  flags: string[];
  doneBeats: string[];
  /** Sequences in progress: resume from `index` after a reload. */
  running: { beat: string; index: number }[];
  threads: Record<ThreadId, ChatMsg[]>;
  unread: Record<ThreadId, number>;
  choice: PendingChoice | null;
  choices: Record<string, string>;
  /** `app`: where to look — surfaced gently as the second hint tier. */
  objective: { text: string; hint: string; since: number; nudge?: Nudge; app?: AppId } | null;
  /** Free-text conversation memory: how often each reply rule fired. */
  talk?: Record<string, number>;
  /** How often each app was opened — the phone notices habits. */
  opens?: Record<string, number>;
  clock: string; // game clock HH:MM
  battery: number;
  installed: AppId[];
  notes: string[];
  seenPhotos: string[];
  calls: CallLogEntry[];
  playerName: string | null;
  startedAtReal: number;
  endings: EndingId[];
  lastEnding: EndingId | null;
  shuffled: boolean;
  sound: boolean;
  reduceFx: boolean;
  passcodeFails: number;
  /** Extra photos that appeared during play (auto-backup…). */
  photos: string[];
  /** Voice memos available (m1 always; m2 is the phone recording you). */
  memos: string[];
  /** What the player typed/dialed — for the memo that recorded them. */
  inputs: string[];
  /** Lock-screen wallpaper; someone changes it during the night. */
  wallpaper?: 'annex' | 'booth';
  /** A story call that is ringing or in progress (re-rings after a reload). */
  pendingCall?: string | null;
  /** Objectives already nudged by a character. */
  nudged: string[];
  /** Season 2 (absent: season 1). */
  season?: 2;
  /** Season 2 only: what it remembers of your season 1. */
  s1?: S1Summary;
  /** Season 2 only: the note that writes itself before 02:00. */
  liveNote?: string;
}
