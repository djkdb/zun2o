// Shared type vocabulary for the whole experience.
// Everything the HorrorEngine reasons about is described here so that data
// files (records, anomalies, secrets, endings) stay declarative.

export type HorrorLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const LEVEL_NAMES: Record<HorrorLevel, string> = {
  0: 'NORMAL',
  1: 'UNCOMFORTABLE',
  2: 'STRANGE',
  3: 'DISTURBING',
  4: 'HORRIFYING',
  5: 'UNKNOWN',
};

/** Phase of the night derived purely from the local clock. */
export type TimePhase =
  | 'day' //        before 01:30 (and after 03:00)
  | 'late' //       01:30 – 01:44
  | 'deep' //       01:45 – 01:54
  | 'breaking' //   01:55 – 01:58
  | 'threshold' //  01:59:00 – 01:59:59
  | 'after' //      02:00 – 02:59
  | 'aftermath'; // 03:00 – 04:59 (the site is quiet, but remembers)

export type SecretId = 'A' | 'B' | 'C' | 'D';
export type EndingId = 'normal' | 'secret' | 'true';
export type SoundPreference = 'on' | 'off';

export interface SecretProgress {
  found: boolean;
  at?: number;
}

/** Everything persisted to localStorage. Versioned; see game/save.ts. */
export interface SaveData {
  saveVersion: 1;
  firstVisit: number;
  lastVisit: number;
  lastActive: number;
  visitCount: number;
  /** Epoch ms of recent visits (newest last), used by Record 009. */
  visitLog: number[];
  totalVisitDuration: number;
  clickCount: number;
  recordViews: Record<string, number>;
  /** Most recently opened records, newest last (bounded). */
  recordSequence: string[];
  discoveredRecords: string[];
  discoveredAnomalies: string[];
  /** Lifetime trigger counts for anomalies flagged `once`. */
  anomalyLifetime: Record<string, number>;
  secretProgress: Record<SecretId, SecretProgress>;
  flags: string[];
  endingUnlocked: EndingId[];
  lastEnding: EndingId | null;
  /** Night keys (YYYY-MM-DD) on which the 02:00 event has been witnessed. */
  mainEventNights: string[];
  soundPreference: SoundPreference;
  reduceEffects: boolean;
  guestbook: { text: string; at: number }[];
}

// ─── Anomalies ────────────────────────────────────────────────────────────

export type AnomalyCategory = 'text' | 'image' | 'ui' | 'time' | 'scroll' | 'sound' | 'screen';

/** Where an anomaly is rendered. Components subscribe to a target. */
export type AnomalyTarget =
  | 'title'
  | 'welcome'
  | 'intro'
  | 'nav'
  | 'clock'
  | 'photo'
  | 'record-list'
  | 'record-body'
  | 'record-title'
  | 'screen'
  | 'scroll'
  | 'audio'
  | 'scare'
  | 'footer';

export type ActionType = 'hover' | 'click' | 'route' | 'section' | 'idle' | 'search' | 'revisit' | 'command';

export type AnomalyTrigger =
  | { kind: 'ambient' }
  | { kind: 'action'; type: ActionType; match: string };

export interface AnomalyRequirements {
  minVisits?: number;
  minSessionSeconds?: number;
  flags?: string[];
  notFlags?: string[];
  anomalies?: string[];
  records?: string[];
}

export interface AnomalyDef {
  id: string;
  label: string;
  category: AnomalyCategory;
  target: AnomalyTarget;
  /** Effect key understood by the target component. */
  effect: string;
  minLevel: HorrorLevel;
  maxLevel: HorrorLevel;
  trigger: AnomalyTrigger;
  /** 0..1 chance to fire once it is eligible. */
  probability: number;
  duration: number;
  cooldown: number;
  /** Per-session cap. */
  maxTriggers: number;
  /** Fires at most once per save (lifetime). */
  once?: boolean;
  /** Relative weight when the ambient scheduler picks. */
  weight?: number;
  /** Flashing / shaking effects — skipped when effects are reduced. */
  intense?: boolean;
  requires?: AnomalyRequirements;
  sound?: SoundId;
  payload?: Record<string, string | number>;
}

export interface ActiveAnomaly {
  id: string;
  effect: string;
  target: AnomalyTarget;
  startedAt: number;
  until: number;
  /** Increments every fire so components can re-key animations. */
  nonce: number;
  payload?: Record<string, string | number>;
}

export interface GameAction {
  type: ActionType;
  target: string;
}

// ─── Records ─────────────────────────────────────────────────────────────

export type RecordAccess = 'public' | 'restricted' | 'denied' | 'hidden';

export type PhotoScene = 'reading-room' | 'annex' | 'floorplan' | 'tower' | 'cassette' | 'notice' | 'room-02';

export type Variants = Partial<Record<HorrorLevel, string>>;

export type RecordBlock =
  | { type: 'p'; text: string; variants?: Variants; minLevel?: HorrorLevel; anomalyTarget?: boolean }
  | { type: 'h'; text: string; variants?: Variants }
  | { type: 'photo'; scene: PhotoScene; caption: string; captionVariants?: Variants }
  | { type: 'table'; rows: [string, string][]; variants?: Partial<Record<HorrorLevel, [string, string][]>> }
  | { type: 'transcript'; lines: string[]; variants?: Partial<Record<HorrorLevel, string[]>> }
  | { type: 'section'; id: string; label: string }
  | { type: 'secret-sentence'; text: string; before?: string; after?: string }
  | { type: 'notice'; text: string; variants?: Variants }
  | { type: 'visitor-log' }
  | { type: 'link'; href: string; label: string };

export interface ArchiveRecord {
  id: string;
  title: string;
  titleVariants?: Variants;
  date: string;
  classification: string;
  access: RecordAccess;
  summary: string;
  summaryVariants?: Variants;
  tags: string[];
  blocks: RecordBlock[];
}

// ─── Secrets & endings ───────────────────────────────────────────────────

export interface SecretDef {
  id: SecretId;
  name: string;
  hint: string;
  description: string;
}

export interface EndingRequirement {
  secrets?: SecretId[];
  phase?: TimePhase[];
}

export interface EndingDef {
  id: EndingId;
  index: number;
  title: string;
  subtitle: string;
  /** Which in-world action completes this ending. */
  trigger: 'leave' | 'terminal-key' | 'accept-shift';
  requires: EndingRequirement;
  lines: string[];
}

// ─── Audio ───────────────────────────────────────────────────────────────

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
  | 'scream';

// ─── Main event ──────────────────────────────────────────────────────────

export type MainEventStage =
  | 'idle'
  | 'freeze'
  | 'silence'
  | 'fade'
  | 'retitle'
  | 'strip-menu'
  | 'dark'
  | 'record'
  | 'recall'
  | 'photo'
  | 'scare'
  | 'navigate'
  | 'reveal'
  | 'done';

export interface MainEventStep {
  at: number;
  stage: MainEventStage;
  sound?: SoundId;
}
