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
      at: 8200,
      options: [
        { id: 'pretend', label: '…응, 엄마. 나야.' },
        { id: 'truth', label: '소연 씨 폰을 주운 사람이에요.' },
      ],
    },
    afterBy: {
      pretend: [
        { at: 600, who: 'caller', text: '목소리가 왜 그러니. 감기 걸렸니.', voice: 'mother' },
        { at: 4200, who: 'caller', text: '소연아, 엄마 손이 또 볼펜을 쥐었다. 안 놓아져.', voice: 'mother' },
        { at: 8200, who: 'caller', text: '오늘은 자지도 않았는데 손이 먼저 일어났다.', voice: 'mother' },
        { at: 11800, who: 'sfx', text: '(볼펜이 종이를 긁는 소리)' },
        { at: 13600, who: 'caller', text: '엄마가 쓰기 전에 집에 와. 두 시 전에는 와.', voice: 'mother' },
        { at: 17800, who: 'other', text: '다 적어 뒀어요.', voice: 'entity' },
        { at: 20200, who: 'sfx', text: '(통화 종료)' },
      ],
      truth: [
        { at: 600, who: 'caller', text: '…그럼 우리 소연이는요.', voice: 'mother' },
        { at: 3600, who: 'caller', text: '미안해요. 손이 혼자 움직여요. 벌써 날짜를 썼어요. 이제 이름이에요.', voice: 'mother' },
        { at: 8400, who: 'sfx', text: '(볼펜이 종이를 긁는 소리)' },
        { at: 10400, who: 'caller', text: '우리 딸 좀 데려와 주세요. 이름 다 쓰기 전에. …부탁합니다.', voice: 'mother' },
        { at: 15200, who: 'other', text: '다 적어 뒀어요.', voice: 'entity' },
        { at: 17600, who: 'sfx', text: '(통화 종료)' },
      ],
    },
  },
};
