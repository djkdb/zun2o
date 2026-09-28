import type { HorrorLevel, SaveData } from '../game/types';
import { formatHM, secondsOfDay } from '../utils/time';

// 보관소는 "기억한다" — 여기 있는 것은 전부 localStorage에서 계산된다.

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

const visitor = (n: number) => `방문자 #${String(n).padStart(4, '0')}`;

export function welcomeLine({ save, previousVisit, previousActive, now, level }: WelcomeInput): string {
  if (save.flags.includes('ending-true')) return '어서 오세요, 기록사님. 근무는 02:00에 시작합니다.';
  if (level >= 5) return '아직 여기 계시네요.';
  if (level >= 3 && inWindow(now, 1 * 3600 + 55 * 60, 2 * 3600)) return `지금은 ${formatHM(new Date(now))}입니다. 여기 계시면 안 됩니다.`;
  if (save.visitCount <= 1) return '어서 오세요.';
  if (previousVisit !== null && inWindow(previousVisit, 1 * 3600 + 50 * 60, 2 * 3600)) {
    return `지난번엔 ${formatHM(new Date(previousVisit))}에 오셨죠.`;
  }
  if (previousActive !== null && save.flags.includes('saw-main-event') && inWindow(previousActive, 2 * 3600, 5 * 3600)) {
    return `${formatHM(new Date(previousActive))}에 나가셨죠. 등은 켜 두었습니다.`;
  }
  if (save.lastEnding === 'normal') return '퇴실하셨잖아요. 그런데도 다시 오셨네요.';
  if (save.lastEnding === 'secret') return `${visitor(save.visitCount)}. 기록에 올라 있습니다.`;
  switch (save.visitCount) {
    case 2:
      return '다시 오셨네요.';
    case 3:
      return '또 오셨군요.';
    case 4:
      return '또요?';
    case 5:
    case 6:
      return '자리는 그대로 두었습니다.';
    default:
      return `${visitor(save.visitCount)}. 역시.`;
  }
}

export const INTRO_TEXT: Record<HorrorLevel, string> = {
  0: '심야 기록보관소는 1995년 폐쇄된 해원군청 별관에서 옮겨 온 기록을 보존합니다. 목록 작업은 대부분 밤에 일하는 자원봉사자들이 맡고 있습니다. 새로 스캔한 기록은 매일 밤 기록 동기화 때 추가됩니다.',
  1: '심야 기록보관소는 1995년 폐쇄된 해원군청 별관에서 옮겨 온 기록을 보존합니다. 목록 작업은 대부분 밤에 일하는 자원봉사자들이 맡고 있습니다. 새로 스캔한 기록은 매일 밤 기록 동기화 때 추가됩니다.',
  2: '심야 기록보관소는 1995년 폐쇄된 해원군청 별관에서 옮겨 온 기록을 보존합니다. 목록 작업은 대부분 밤에 일하는 자원봉사자들이 맡고 있습니다. 일부 기록은 밤에 추가되는데, 그것을 스캔했다고 기억하는 자원봉사자는 없습니다.',
  3: '심야 기록보관소는 해원군청 별관에서 옮겨 온 기록을 보존합니다. 목록 작업은 밤에 이루어집니다. 기록은 동기화 때 추가됩니다. 아무도 스캔하지 않습니다. 동기화 전에 열람을 마쳐 주십시오.',
  4: '심야 기록보관소는 해원군청 별관에서 옮겨 온 기록을 보존합니다. 곧 동기화가 시작됩니다. 지금 계신 자리에 그대로 계십시오.',
  5: '심야 기록보관소가 열렸습니다. 열람실에 근무자가 있습니다. 색인은 밤이 되면 길어집니다.',
};
