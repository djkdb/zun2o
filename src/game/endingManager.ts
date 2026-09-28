import type { EndingDef, EndingId, SaveData, TimePhase } from './types';
import { ENDING_BY_ID } from '../data/endings';

export function endingAvailable(def: EndingDef, save: SaveData, phase: TimePhase): boolean {
  const { secrets, phase: phases } = def.requires;
  if (secrets && !secrets.every((s) => save.secretProgress[s].found)) return false;
  if (phases && !phases.includes(phase)) return false;
  return true;
}

export function canReachEnding(id: EndingId, save: SaveData, phase: TimePhase): boolean {
  return endingAvailable(ENDING_BY_ID[id], save, phase);
}

/** The ending the site currently "leans towards" (for the debug panel). */
export function currentEnding(save: SaveData, phase: TimePhase): EndingId {
  if (canReachEnding('true', save, phase)) return 'true';
  if (canReachEnding('secret', save, phase)) return 'secret';
  return 'normal';
}
