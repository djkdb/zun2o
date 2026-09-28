import type { HorrorLevel, SaveData } from '../game/types';
import { formatHM, secondsOfDay } from '../utils/time';

// The archive "remembers" — everything here is computed from localStorage.

export interface WelcomeInput {
  save: SaveData;
  previousVisit: number | null;
  previousActive: number | null;
  now: number;
  level: HorrorLevel;
}

const inWindow = (t: number, from: number, to: number) => {
  const s = secondsOfDay(new Date(t));
  return s >= from && s < to;
};

export function welcomeLine({ save, previousVisit, previousActive, now, level }: WelcomeInput): string {
  if (save.flags.includes('ending-true')) return 'Welcome back, archivist. Your shift begins at 02:00.';
  if (level >= 5) return 'You are still here.';
  if (level >= 3 && inWindow(now, 1 * 3600 + 55 * 60, 2 * 3600)) return `It is ${formatHM(new Date(now))}. You should not be here.`;
  if (save.visitCount <= 1) return 'Welcome.';
  if (previousVisit !== null && inWindow(previousVisit, 1 * 3600 + 50 * 60, 2 * 3600)) {
    return `You came at ${formatHM(new Date(previousVisit))}.`;
  }
  if (previousActive !== null && save.flags.includes('saw-main-event') && inWindow(previousActive, 2 * 3600, 5 * 3600)) {
    return `You left at ${formatHM(new Date(previousActive))}. We kept the lamp on.`;
  }
  if (save.lastEnding === 'normal') return 'You checked out. You came back anyway.';
  if (save.lastEnding === 'secret') return 'Visitor #' + String(save.visitCount).padStart(4, '0') + '. You are on file.';
  switch (save.visitCount) {
    case 2:
      return 'Welcome back.';
    case 3:
      return "You're back.";
    case 4:
      return 'Again?';
    case 5:
    case 6:
      return 'We kept your seat.';
    default:
      return `Visitor #${String(save.visitCount).padStart(4, '0')}. Of course.`;
  }
}

export const INTRO_TEXT: Record<HorrorLevel, string> = {
  0: 'The Night Archive preserves records transferred from the Harrow County Municipal Annex after its closure in 1995. The collection is catalogued by volunteers, most of whom work at night. New scans are added during the nightly archive sync.',
  1: 'The Night Archive preserves records transferred from the Harrow County Municipal Annex after its closure in 1995. The collection is catalogued by volunteers, most of whom work at night. New scans are added during the nightly archive sync.',
  2: 'The Night Archive preserves records transferred from the Harrow County Municipal Annex after its closure in 1995. The collection is catalogued by volunteers, most of whom work at night. Some records are added during the nightly sync that no volunteer remembers scanning.',
  3: 'The Night Archive preserves records transferred from the Harrow County Municipal Annex. The collection is catalogued at night. Records are added during the nightly sync. Nobody scans them. Please finish reading before the sync.',
  4: 'The Night Archive preserves records transferred from the Harrow County Municipal Annex. The sync is about to begin. Please remain where you are.',
  5: 'The Night Archive is open. The reading room is staffed. The index is longer at night.',
};
