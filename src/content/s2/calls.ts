import type { CallScript } from '../../engine/types';

// 시즌 2 — 01:53, 엄마가 소연의 폰으로 전화를 건다.

export const CALLS_S2: Record<string, CallScript> = {
  eomma: {
    id: 'eomma',
    from: 'mom',
    label: '엄마',
    duration: 0,
    lines: [
      { at: 700, who: 'sfx', text: '(벽시계 초침 소리)' },
      { at: 2400, who: 'caller', text: '…소연이니?', voice: 'mother' },
      { at: 5200, who: 'caller', text: '엄마야. 왜 대답을 안 해.', voice: 'mother' },
    ],
    choice: {
      at: 8800,
      options: [
        { id: 'pretend', label: '…응, 엄마. 나야.' },
        { id: 'truth', label: '소연 씨 폰을 주운 사람이에요.' },
      ],
    },
    afterBy: {
      pretend: [
        { at: 600, who: 'caller', text: '목소리가 왜 그러니. 감기 걸렸니.', voice: 'mother' },
        { at: 4200, who: 'caller', text: '소연아, 엄마가 또 볼펜을 쥐었다. 손이 안 펴진다.', voice: 'mother' },
        { at: 9000, who: 'caller', text: '오늘은 자지도 않았는데 손이 먼저 일어났다.', voice: 'mother' },
        { at: 14500, who: 'sfx', text: '(볼펜이 종이를 긁는 소리)' },
        { at: 15000, who: 'caller', text: '엄마가 쓰기 전에 집에 와. 두 시 전에는 와.', voice: 'mother' },
        { at: 19300, who: 'other', text: '다 적어 뒀어요.', voice: 'entity' },
        { at: 21700, who: 'sfx', text: '(통화 종료)' },
      ],
      truth: [
        { at: 600, who: 'caller', text: '…그럼 우리 소연이는요.', voice: 'mother' },
        { at: 3600, who: 'caller', text: '미안해요. 손이 혼자 움직여요. 벌써 날짜를 썼어요. 이제 이름이에요.', voice: 'mother' },
        { at: 10700, who: 'sfx', text: '(볼펜이 종이를 긁는 소리)' },
        { at: 11600, who: 'caller', text: '우리 딸 좀 데려와 주세요. 이름 다 쓰기 전에. …부탁합니다.', voice: 'mother' },
        { at: 18000, who: 'other', text: '다 적어 뒀어요.', voice: 'entity' },
        { at: 20400, who: 'sfx', text: '(통화 종료)' },
      ],
    },
  },
};
