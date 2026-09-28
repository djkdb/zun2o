import type {
  ActiveAnomaly,
  AnomalyDef,
  AnomalyTarget,
  EndingId,
  GameAction,
  HorrorLevel,
  MainEventStage,
  SaveData,
  SecretId,
  SoundId,
  TimePhase,
} from './types';
import { clearSave, createSave, limits, loadSave, persistSave } from './save';
import { computeHorrorLevel, engineInputFrom, LEVEL_PROFILES } from './horrorEngine';
import { type AnomalyContext, selectAmbient, selectForAction } from './eventManager';
import { sequenceSatisfied } from './secretManager';
import { getNow, publish as publishClock, resetVirtualTime, setVirtualTime } from './clock';
import { ANOMALIES } from '../data/anomalies';
import { welcomeLine } from '../data/copy';
import { between, defaultRng, pick, type Rng } from '../utils/random';
import { nightKey, phaseOf } from '../utils/time';
import { readItem, writeItem } from '../utils/storage';
import { prefersReducedMotion } from '../utils/env';

// ─────────────────────────────────────────────────────────────────────────
// Game store — a tiny external store (no framework dependency) that holds
// the persisted save plus volatile session state. React reads it through
// useSyncExternalStore (hooks/useGame.ts). All mutations live here.
// ─────────────────────────────────────────────────────────────────────────

export interface SessionState {
  startedAt: number;
  sessionSeconds: number;
  phase: TimePhase;
  level: HorrorLevel;
  levelOverride: HorrorLevel | null;
  active: Partial<Record<AnomalyTarget, ActiveAnomaly>>;
  sessionCounts: Record<string, number>;
  lastFired: Record<string, number>;
  triggeredLog: { id: string; at: number; source: string }[];
  mountedTargets: Partial<Record<AnomalyTarget, number>>;
  nextAmbientAt: number;
  lastInteraction: number;
  idleFired: boolean;
  mainEvent: { stage: MainEventStage; startedAt: number | null; pendingAt: number | null };
  welcome: string;
  previousVisit: number | null;
  previousActive: number | null;
  debug: boolean;
  notice: { text: string; nonce: number } | null;
  audioReady: boolean;
  /** Has the visitor passed the entry warning this browser session? */
  entered: boolean;
  /** Last time an anomaly was seen for the first time (for the notebook). */
  lastDiscovery: { id: string; at: number } | null;
}

export interface GameState {
  save: SaveData;
  session: SessionState;
}

type Listener = () => void;
type SoundListener = (id: SoundId) => void;

const listeners = new Set<Listener>();
const soundListeners = new Set<SoundListener>();
const timers = new Set<ReturnType<typeof setTimeout>>();
let rng: Rng = defaultRng;
let nonce = 1;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

const OVERRIDE_KEY = 'na_level_override';
const ENTERED_KEY = 'na_entered';

function skipIntroParam(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('intro') === '0';
}

function initialSession(debug: boolean): SessionState {
  const now = Date.now();
  const storedOverride = readItem(OVERRIDE_KEY, 'session');
  const override = storedOverride !== null && /^[0-5]$/.test(storedOverride) ? (Number(storedOverride) as HorrorLevel) : null;
  return {
    startedAt: now,
    sessionSeconds: 0,
    phase: 'day',
    level: 0,
    levelOverride: debug ? override : null,
    active: {},
    sessionCounts: {},
    lastFired: {},
    triggeredLog: [],
    mountedTargets: {},
    nextAmbientAt: now + 30_000,
    lastInteraction: now,
    idleFired: false,
    mainEvent: { stage: 'idle', startedAt: null, pendingAt: null },
    welcome: 'Welcome.',
    previousVisit: null,
    previousActive: null,
    debug,
    notice: null,
    audioReady: false,
    entered: readItem(ENTERED_KEY, 'session') === '1' || (debug && skipIntroParam()),
    lastDiscovery: null,
  };
}

let state: GameState = { save: createSave(Date.now()), session: initialSession(false) };

// ─── plumbing ────────────────────────────────────────────────────────────

export function getState(): GameState {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function onSound(listener: SoundListener): () => void {
  soundListeners.add(listener);
  return () => soundListeners.delete(listener);
}

export function playSound(id: SoundId): void {
  soundListeners.forEach((l) => l(id));
}

function set(updater: (s: GameState) => GameState, persist = false): void {
  const next = updater(state);
  if (next === state) return;
  state = next;
  listeners.forEach((l) => l());
  if (persist) schedulePersist();
}

function patchSession(patch: Partial<SessionState>): void {
  set((s) => ({ ...s, session: { ...s.session, ...patch } }));
}

function patchSave(patch: Partial<SaveData> | ((save: SaveData) => Partial<SaveData>)): void {
  set((s) => ({ ...s, save: { ...s.save, ...(typeof patch === 'function' ? patch(s.save) : patch) } }), true);
}

function schedulePersist(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistSave(state.save);
  }, 400);
}

export function flushPersist(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  persistSave(state.save);
}

function later(fn: () => void, ms: number): void {
  const t = setTimeout(() => {
    timers.delete(t);
    fn();
  }, ms);
  timers.add(t);
}

export function setRng(next: Rng): void {
  rng = next;
}

// ─── derived helpers ─────────────────────────────────────────────────────

function evaluateLevel(s: GameState, phase: TimePhase): HorrorLevel {
  return computeHorrorLevel(engineInputFrom(s.save, phase, s.session.sessionSeconds, s.session.levelOverride));
}

function anomalyContext(s: GameState): AnomalyContext {
  return {
    now: Date.now(),
    level: s.session.level,
    sessionSeconds: s.session.sessionSeconds,
    visitCount: s.save.visitCount,
    flags: s.save.flags,
    discoveredAnomalies: s.save.discoveredAnomalies,
    viewedRecords: Object.keys(s.save.recordViews),
    sessionCounts: s.session.sessionCounts,
    lastFired: s.session.lastFired,
    lifetime: s.save.anomalyLifetime,
    mountedTargets: s.session.mountedTargets,
    busyTargets: new Set(Object.keys(s.session.active) as AnomalyTarget[]),
    reduceEffects: s.save.reduceEffects || prefersReducedMotion(),
  };
}

export function mainEventRunning(s: GameState = state): boolean {
  const stage = s.session.mainEvent.stage;
  return stage !== 'idle' && stage !== 'done';
}

// ─── lifecycle ───────────────────────────────────────────────────────────

const VISIT_GAP = 10 * 60 * 1000;

/** Load the save, register this visit, compute the greeting. */
export function bootstrap(debug: boolean): void {
  const now = getNow();
  const save = loadSave(now);
  const session = initialSession(debug);
  const marker = readItem('na_visit', 'session');
  const isNewVisit = !marker || now - save.lastActive > VISIT_GAP || save.visitCount === 0;
  const previousVisit = save.visitCount > 0 ? save.lastVisit : null;
  const previousActive = save.visitCount > 0 ? save.lastActive : null;
  let next = save;
  if (isNewVisit) {
    next = {
      ...save,
      visitCount: save.visitCount + 1,
      visitLog: [...save.visitLog, now].slice(-limits.MAX_LOG),
      lastVisit: now,
      lastActive: now,
    };
    writeItem('na_visit', String(now), 'session');
  }
  const phase = phaseOf(new Date(now));
  session.phase = phase;
  session.previousVisit = isNewVisit ? previousVisit : null;
  session.previousActive = isNewVisit ? previousActive : null;
  state = { save: next, session };
  const level = evaluateLevel(state, phase);
  state = { ...state, session: { ...state.session, level } };
  state.session.welcome = welcomeLine({ save: next, previousVisit: session.previousVisit, previousActive: session.previousActive, now, level });
  // Opening the site during 02:00–02:59 for the first time tonight: let the
  // page settle for a few seconds, then begin.
  const calm = next.flags.includes('ending-true');
  if (phase === 'after' && !calm && !next.mainEventNights.includes(nightKey(new Date(now)))) {
    state.session.mainEvent = { stage: 'idle', startedAt: null, pendingAt: Date.now() + 6000 };
  } else if (phase === 'after' && !calm) {
    state.session.mainEvent = { stage: 'done', startedAt: null, pendingAt: null };
  }
  state.session.nextAmbientAt = Date.now() + LEVEL_PROFILES[level].firstAmbientAfter * 1000;
  persistSave(next);
  listeners.forEach((l) => l());
}

export function teardown(): void {
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  flushPersist();
}

/** Called once per (virtual) second by the director. */
export function tick(): void {
  const real = Date.now();
  const now = getNow();
  publishClock();
  const visible = typeof document === 'undefined' || document.visibilityState === 'visible';
  const s = state;
  const phase = phaseOf(new Date(now));
  const sessionSeconds = s.session.sessionSeconds + (visible && s.session.entered ? 1 : 0);

  // Expire anomalies whose timers were throttled (background tabs).
  let active = s.session.active;
  for (const [target, a] of Object.entries(active) as [AnomalyTarget, ActiveAnomaly][]) {
    if (a.until <= real) {
      if (active === s.session.active) active = { ...active };
      delete active[target];
    }
  }

  const prevPhase = s.session.phase;
  let mainEvent = s.session.mainEvent;
  const tonight = nightKey(new Date(now));
  if (
    phase === 'after' &&
    prevPhase !== 'after' &&
    mainEvent.stage === 'idle' &&
    !s.save.mainEventNights.includes(tonight) &&
    !s.save.flags.includes('ending-true')
  ) {
    mainEvent = { stage: 'idle', startedAt: null, pendingAt: real };
  }
  if (phase !== 'after' && !mainEventRunning(s) && mainEvent.stage === 'done') {
    mainEvent = { stage: 'idle', startedAt: null, pendingAt: null };
  }
  if (phase !== 'after' && mainEvent.pendingAt !== null && s.session.levelOverride === null) {
    mainEvent = { ...mainEvent, pendingAt: null };
  }

  const draft: GameState = {
    save: visible
      ? { ...s.save, totalVisitDuration: s.save.totalVisitDuration + 1000, lastActive: now }
      : s.save,
    session: { ...s.session, phase, sessionSeconds, active, mainEvent },
  };
  const level = evaluateLevel(draft, phase);
  let nextAmbientAt = draft.session.nextAmbientAt;
  if (level !== s.session.level) {
    const gap = LEVEL_PROFILES[level].ambientGap;
    nextAmbientAt = Math.min(nextAmbientAt, real + between(rng, gap[0] * 0.3, gap[0]));
  }
  draft.session.level = level;
  draft.session.nextAmbientAt = nextAmbientAt;
  state = draft;
  if (sessionSeconds % 10 === 0) schedulePersist();
  listeners.forEach((l) => l());

  // Nothing happens until the visitor has walked past the entry warning.
  if (!state.session.entered) return;

  if (mainEvent.pendingAt !== null && real >= mainEvent.pendingAt && !mainEventRunning()) {
    startMainEvent();
    return;
  }

  // Idle → whisper.
  if (!state.session.idleFired && real - state.session.lastInteraction >= 45_000) {
    patchSession({ idleFired: true });
    emit({ type: 'idle', target: 'idle-45' });
  }

  runAmbient(real);
}

function runAmbient(real: number): void {
  const s = state;
  if (mainEventRunning(s)) return;
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
  const profile = LEVEL_PROFILES[s.session.level];
  if (real < s.session.nextAmbientAt || s.session.sessionSeconds < profile.firstAmbientAfter) return;
  if (Object.keys(s.session.active).length >= profile.maxConcurrent) return;
  const def = selectAmbient(ANOMALIES, anomalyContext(s), rng);
  const gap = profile.ambientGap;
  patchSession({ nextAmbientAt: real + (def ? between(rng, gap[0], gap[1]) : 5000) });
  if (def) fireAnomaly(def, 'ambient');
}

// ─── anomalies ───────────────────────────────────────────────────────────

export function fireAnomaly(def: AnomalyDef, source: string): void {
  const real = Date.now();
  const id = nonce++;
  const anomaly: ActiveAnomaly = {
    id: def.id,
    effect: def.effect,
    target: def.target,
    startedAt: real,
    until: real + def.duration,
    nonce: id,
    payload: def.payload,
  };
  set(
    (s) => ({
      save: {
        ...s.save,
        discoveredAnomalies: s.save.discoveredAnomalies.includes(def.id)
          ? s.save.discoveredAnomalies
          : [...s.save.discoveredAnomalies, def.id],
        anomalyLifetime: def.once
          ? { ...s.save.anomalyLifetime, [def.id]: (s.save.anomalyLifetime[def.id] ?? 0) + 1 }
          : s.save.anomalyLifetime,
      },
      session: {
        ...s.session,
        active: { ...s.session.active, [def.target]: anomaly },
        sessionCounts: { ...s.session.sessionCounts, [def.id]: (s.session.sessionCounts[def.id] ?? 0) + 1 },
        lastFired: { ...s.session.lastFired, [def.id]: real },
        triggeredLog: [...s.session.triggeredLog, { id: def.id, at: getNow(), source }].slice(-40),
        lastDiscovery: s.save.discoveredAnomalies.includes(def.id) ? s.session.lastDiscovery : { id: def.id, at: real },
      },
    }),
    true,
  );
  if (def.sound) playSound(def.sound);
  later(() => clearAnomaly(def.target, id), def.duration);
}

export function clearAnomaly(target: AnomalyTarget, anomalyNonce: number): void {
  const current = state.session.active[target];
  if (!current || current.nonce !== anomalyNonce) return;
  set((s) => {
    const active = { ...s.session.active };
    delete active[target];
    return { ...s, session: { ...s.session, active } };
  });
}

export function emit(action: GameAction): void {
  if (mainEventRunning()) return;
  const defs = selectForAction(action, ANOMALIES, anomalyContext(state), rng);
  defs.forEach((d) => fireAnomaly(d, `${action.type}:${action.target}`));
}

export function mountTarget(target: AnomalyTarget): () => void {
  set((s) => ({
    ...s,
    session: {
      ...s.session,
      mountedTargets: { ...s.session.mountedTargets, [target]: (s.session.mountedTargets[target] ?? 0) + 1 },
    },
  }));
  return () =>
    set((s) => ({
      ...s,
      session: {
        ...s.session,
        mountedTargets: { ...s.session.mountedTargets, [target]: Math.max(0, (s.session.mountedTargets[target] ?? 1) - 1) },
      },
    }));
}

/** Debug: fire a random eligible anomaly regardless of the ambient timer. */
export function triggerRandomAnomaly(): string | null {
  const ctx = { ...anomalyContext(state), busyTargets: new Set<AnomalyTarget>() };
  const pool = ANOMALIES.filter(
    (d) =>
      d.trigger.kind === 'ambient' &&
      ctx.level >= d.minLevel &&
      ctx.level <= d.maxLevel &&
      (['screen', 'audio', 'scroll', 'scare'].includes(d.target) || (ctx.mountedTargets[d.target] ?? 0) > 0),
  );
  const def = pick(rng, pool);
  if (!def) return null;
  fireAnomaly(def, 'debug');
  return def.id;
}

export function fireAnomalyById(id: string): void {
  const def = ANOMALIES.find((a) => a.id === id);
  if (def) fireAnomaly(def, 'debug');
}

// ─── interaction ─────────────────────────────────────────────────────────

export function markInteraction(): void {
  const s = state.session;
  const real = Date.now();
  if (real - s.lastInteraction < 500 && !s.idleFired) return;
  patchSession({ lastInteraction: real, idleFired: false });
}

export function registerClick(): void {
  patchSave((save) => ({ clickCount: save.clickCount + 1 }));
}

/** The visitor walked past the entry warning. */
export function enterArchive(): void {
  if (state.session.entered) return;
  writeItem(ENTERED_KEY, '1', 'session');
  const real = Date.now();
  const profile = LEVEL_PROFILES[state.session.level];
  const pending = state.session.mainEvent.pendingAt;
  set((s) => ({
    ...s,
    session: {
      ...s.session,
      entered: true,
      lastInteraction: real,
      nextAmbientAt: real + profile.firstAmbientAfter * 1000,
      mainEvent: pending !== null ? { ...s.session.mainEvent, pendingAt: Math.max(pending, real + 4000) } : s.session.mainEvent,
    },
  }));
}

export function setAudioReady(ready: boolean): void {
  if (state.session.audioReady !== ready) patchSession({ audioReady: ready });
}

export function showNotice(text: string): void {
  patchSession({ notice: { text, nonce: nonce++ } });
}

export function dismissNotice(): void {
  patchSession({ notice: null });
}

// ─── records & secrets ───────────────────────────────────────────────────

/** Register that a record was opened. Returns true if this was a revisit. */
export function recordOpened(id: string): boolean {
  const before = state.save.recordViews[id] ?? 0;
  patchSave((save) => ({
    recordViews: { ...save.recordViews, [id]: (save.recordViews[id] ?? 0) + 1 },
    recordSequence: [...save.recordSequence, id].slice(-limits.MAX_SEQUENCE),
    discoveredRecords: save.discoveredRecords.includes(id) ? save.discoveredRecords : [...save.discoveredRecords, id],
  }));
  if (id === '007' && !hasFlag('record-013-indexed') && sequenceSatisfied(state.save.recordSequence)) {
    setFlag('record-013-indexed');
    later(() => {
      playSound('unlock');
      showNotice('기록 013이 색인에 추가되었습니다.');
    }, 1800);
  }
  emit({ type: 'route', target: `record/${id}` });
  if (before > 0) emit({ type: 'revisit', target: `record/${id}` });
  return before > 0;
}

export function hasFlag(flag: string): boolean {
  return state.save.flags.includes(flag);
}

export function setFlag(flag: string): void {
  if (hasFlag(flag)) return;
  patchSave((save) => ({ flags: [...save.flags, flag] }));
}

export function findSecret(id: SecretId): boolean {
  if (state.save.secretProgress[id].found) return false;
  patchSave((save) => ({
    secretProgress: { ...save.secretProgress, [id]: { found: true, at: getNow() } },
  }));
  playSound('unlock');
  return true;
}

export function unlockEnding(id: EndingId): void {
  patchSave((save) => ({
    endingUnlocked: save.endingUnlocked.includes(id) ? save.endingUnlocked : [...save.endingUnlocked, id],
    lastEnding: id,
    flags: save.flags.includes(`ending-${id}`) ? save.flags : [...save.flags, `ending-${id}`],
  }));
  flushPersist();
}

export function addGuestbookEntry(text: string): void {
  const clean = text.trim().slice(0, 280);
  if (!clean) return;
  patchSave((save) => ({ guestbook: [...save.guestbook, { text: clean, at: getNow() }].slice(-limits.MAX_GUESTBOOK) }));
}

// ─── preferences ─────────────────────────────────────────────────────────

export function setSoundPreference(on: boolean): void {
  patchSave({ soundPreference: on ? 'on' : 'off' });
}

export function setReduceEffects(on: boolean): void {
  patchSave({ reduceEffects: on });
}

// ─── main event ──────────────────────────────────────────────────────────

export function startMainEvent(): void {
  set((s) => ({
    ...s,
    session: {
      ...s.session,
      active: {},
      mainEvent: { stage: 'freeze', startedAt: Date.now(), pendingAt: null },
    },
  }));
}

export function setMainEventStage(stage: MainEventStage): void {
  if (state.session.mainEvent.stage === stage) return;
  set((s) => ({ ...s, session: { ...s.session, mainEvent: { ...s.session.mainEvent, stage } } }));
  if (stage === 'done') {
    const key = nightKey(new Date(getNow()));
    patchSave((save) => ({
      mainEventNights: save.mainEventNights.includes(key) ? save.mainEventNights : [...save.mainEventNights, key].slice(-60),
      flags: save.flags.includes('saw-main-event') ? save.flags : [...save.flags, 'saw-main-event'],
    }));
    flushPersist();
  }
}

// ─── debug ───────────────────────────────────────────────────────────────

export function setLevelOverride(level: HorrorLevel | null): void {
  writeItem(OVERRIDE_KEY, level === null ? '' : String(level), 'session');
  set((s) => {
    const session = { ...s.session, levelOverride: level };
    const draft = { ...s, session };
    session.level = evaluateLevel(draft, session.phase);
    session.nextAmbientAt = Date.now() + 1500;
    return draft;
  });
}

export function debugSetTime(h: number, m: number, sec = 0): void {
  setVirtualTime(h, m, sec);
  recomputeTimeState();
}

function recomputeTimeState(): void {
  set((s) => {
    const phase = phaseOf(new Date(getNow()));
    const session = { ...s.session, phase, nextAmbientAt: Date.now() + 2000 };
    // Leaving 02:00 through the debug panel resets the event.
    if (phase !== 'after' && !mainEventRunning(s)) session.mainEvent = { stage: 'idle', startedAt: null, pendingAt: null };
    // Jumping into 02:00–02:59 behaves like arriving then.
    if (
      phase === 'after' &&
      s.session.phase !== 'after' &&
      !mainEventRunning(s) &&
      !s.save.flags.includes('ending-true') &&
      !s.save.mainEventNights.includes(nightKey(new Date(getNow())))
    ) {
      session.mainEvent = { stage: 'idle', startedAt: null, pendingAt: Date.now() + 2500 };
    }
    const draft = { ...s, session };
    session.level = evaluateLevel(draft, phase);
    return draft;
  });
}

export function debugResetTime(): void {
  resetVirtualTime();
  recomputeTimeState();
}

/** Jump to 02:00:00 and begin the main event immediately. */
export function debugTriggerMainEvent(): void {
  setLevelOverride(null);
  debugSetTime(2, 0, 0);
  startMainEvent();
}

export function debugResetSave(): void {
  clearSave();
  const debug = state.session.debug;
  writeItem('na_visit', '', 'session');
  state = { save: createSave(getNow()), session: initialSession(debug) };
  bootstrap(debug);
}

export function debugUnlockAll(): void {
  patchSave((save) => ({
    secretProgress: {
      A: { found: true, at: getNow() },
      B: { found: true, at: getNow() },
      C: { found: true, at: getNow() },
      D: { found: true, at: getNow() },
    },
    flags: Array.from(new Set([...save.flags, 'record-013-indexed', 'sentence-found', 'system-unlocked'])),
    recordViews: { '001': 1, '003': 1, '007': 1, '013': 1, ...save.recordViews },
  }));
}
