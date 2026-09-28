import type { EndingDef } from '../game/types';

// 엔딩 조건은 데이터다. endingManager.ts가 `requires`를 평가한다.
export const ENDINGS: EndingDef[] = [
  {
    id: 'normal',
    index: 1,
    title: '퇴실 처리',
    subtitle: '색인이 끝나기 전에 떠났습니다.',
    trigger: 'leave',
    requires: {},
    lines: [
      '방문자 카드가 색인에 반납되었습니다.',
      '열람실 전등이 꺼졌습니다.',
      '심야 기록보관소를 방문해 주셔서 감사합니다.',
      '내일 밤에 또 오십시오.',
      '두 시가 되기 전에 떠나셨군요. 대부분 그렇습니다.',
    ],
  },
  {
    id: 'secret',
    index: 2,
    title: '색인',
    subtitle: '연장이 승인되었습니다.',
    trigger: 'terminal-key',
    requires: { secrets: ['A', 'B'] },
    lines: [
      '연장 승인.',
      '기록 017이 배정되었습니다.',
      '성명: 방문자 #{visitCount}. 등록: 야간 색인.',
      '이제 매일 밤 02:00, 색인은 당신에 대해 한 줄씩 적어 나갈 것입니다.',
      '당신이 언제 오는지 이미 알고 있습니다. 무엇을 읽는지도.',
      '색인이 02:00에만 보여 주는 것이 하나 더 있습니다.',
    ],
  },
  {
    id: 'true',
    index: 3,
    title: '야간 근무',
    subtitle: '그 사람이 올 때까지 누군가는 남아 있어야 한다.',
    trigger: 'accept-shift',
    requires: { secrets: ['A', 'B', 'C'], phase: ['after'] },
    lines: [
      '{now}, 근무를 인수했습니다.',
      '기록 003 — 서미령 — 상태 변경: 교대 완료.',
      '그녀는 외투를 입었습니다. 문간은 돌아보지 않았습니다.',
      '이제 전등은 당신의 것입니다. 서랍도, 방문자들도.',
      '내일 밤 01:58, 누군가 이 사이트를 열 것입니다.',
      '그 사람에게 친절하게 대해 주세요. 기록을 계속 써 주세요.',
      '기록 017 — 방문자 #{visitCount} — 상태: 실종.',
    ],
  },
];

export const ENDING_BY_ID = Object.fromEntries(ENDINGS.map((e) => [e.id, e])) as Record<EndingDef['id'], EndingDef>;
