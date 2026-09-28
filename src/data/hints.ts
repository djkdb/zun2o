import type { HorrorLevel, SaveData, TimePhase } from '../game/types';
import { formatDuration, msUntilNextTwo } from '../utils/time';

// 열람 수첩의 "다음 단서". 진행 상황에 따라 하나씩만 보여 준다.
// 정답을 말하지 않고 방향만 가리킨다.

export function nextHint(save: SaveData, level: HorrorLevel, phase: TimePhase, now: number): string {
  const viewed = (id: string) => (save.recordViews[id] ?? 0) > 0;
  const S = save.secretProgress;
  const untilTwo = formatDuration(msUntilNextTwo(new Date(now)));

  if (Object.keys(save.recordViews).length === 0) return '목록에서 기록을 하나 열어 보세요. 기록 #001부터 읽는 것을 권합니다.';
  if (save.discoveredAnomalies.length === 0) return '화면을 조금 오래 지켜보세요. 제목, 시계, 메뉴… 무언가 바뀌는 순간이 있습니다.';
  if (!S.A.found) {
    if (!viewed('001')) return '기록 #001에서 라디오 운영자가 무엇을 들었는지 읽어 보세요.';
    if (!save.flags.includes('record-013-indexed')) return '라디오가 읽은 숫자 순서대로 기록을 열어 보세요. 중간에 다른 기록을 열면 처음부터 다시입니다.';
    return '색인에 새 기록이 생겼습니다. 목록에서 찾아 열어 보세요.';
  }
  if (!S.B.found) {
    if (!save.flags.includes('sentence-found')) return '기록 #003, 그녀가 마지막으로 꾹꾹 눌러 쓴 문장을 직접 눌러 보세요.';
    return '그 문장 뒤에 주소가 있었습니다. 그곳의 파일을 열어 보세요.';
  }
  if (!save.endingUnlocked.includes('secret')) return '기록 #013에 적힌 열쇠를, 그녀의 단말기에 입력해 보세요.';
  if (!S.D.found) {
    return level >= 2
      ? '존재하지 않는다는 방이 있었습니다. 검색창에서 그 방을 찾아보세요.'
      : '이 보관소에 없다는 방이 하나 있습니다. 보관소가 불안해지면 검색에 나타납니다. (조금 더 머물러 보세요)';
  }
  if (!S.C.found) return `기록 #009는 새벽 2시에만 열립니다. 02:00에 다시 오세요. (남은 시간 ${untilTwo})`;
  if (!save.endingUnlocked.includes('true')) {
    return phase === 'after' ? '기록 017이 당신을 기다리고 있습니다. 메뉴의 ‘미상’.' : `새벽 2시, 기록 017에서 근무를 인수할 수 있습니다. (남은 시간 ${untilTwo})`;
  }
  return '모든 것을 보았습니다. 그래도 새벽 2시에 다시 오세요. 누군가 기다리고 있습니다.';
}
