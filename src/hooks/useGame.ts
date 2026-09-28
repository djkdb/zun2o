import { useEffect, useSyncExternalStore } from 'react';
import { getState, mountTarget, subscribe, type GameState } from '../game/store';
import type { ActiveAnomaly, AnomalyTarget, HorrorLevel, MainEventStage } from '../game/types';

/** Subscribe to a slice of the game state. Selectors must return stable values. */
export function useGame<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getState()), () => selector(getState()));
}

export function useHorrorLevel(): HorrorLevel {
  return useGame((s) => s.session.level);
}

export function useMainEventStage(): MainEventStage {
  return useGame((s) => s.session.mainEvent.stage);
}

const EVENT_ORDER: MainEventStage[] = [
  'idle',
  'freeze',
  'silence',
  'fade',
  'retitle',
  'strip-menu',
  'dark',
  'record',
  'recall',
  'photo',
  'scare',
  'navigate',
  'reveal',
  'done',
];

/** True once the 02:00 sequence has reached (or passed) the given stage. */
export function stageReached(current: MainEventStage, stage: MainEventStage): boolean {
  if (current === 'idle') return false;
  return EVENT_ORDER.indexOf(current) >= EVENT_ORDER.indexOf(stage);
}

/**
 * The level used for visuals. During the first part of the 02:00 sequence
 * the page still looks like 01:59; it only turns once the lights go out.
 */
export function useVisualLevel(): HorrorLevel {
  const level = useHorrorLevel();
  const stage = useMainEventStage();
  if (stage !== 'idle' && stage !== 'done' && !stageReached(stage, 'navigate')) return 4;
  return level;
}

/**
 * Register a component as an anomaly target and receive the anomaly
 * currently affecting it (or null). Mounted targets are what the scheduler
 * considers "visible", so anomalies never fire into the void.
 */
export function useAnomaly(target: AnomalyTarget): ActiveAnomaly | null {
  useEffect(() => mountTarget(target), [target]);
  return useGame((s) => s.session.active[target] ?? null);
}

/** Read an active anomaly without registering as a visible target. */
export function usePeekAnomaly(target: AnomalyTarget): ActiveAnomaly | null {
  return useGame((s) => s.session.active[target] ?? null);
}
