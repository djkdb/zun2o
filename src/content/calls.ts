import type { CallScript } from '../engine/types';

export const CALLS: Record<string, CallScript> = {
  dohyun1: {
    id: 'dohyun1',
    from: 'dohyun',
    label: '도현',
    duration: 0,
    lines: [
      { at: 800, who: 'caller', text: '여보세요? …채원아?', voice: 'male' },
      { at: 3600, who: 'caller', text: '채원이야? 말 좀 해 봐.', voice: 'male' },
    ],
    choice: {
      at: 6200,
      options: [
        { id: 'finder', label: '채원 씨 폰을 주운 사람이에요' },
        { id: 'silent', label: '(아무 말도 하지 않는다)' },
      ],
    },
    after: [
      { at: 500, who: 'caller', text: '…별관 앞에서 주운 거죠? 거기서 당장 떠나세요.', voice: 'male' },
      { at: 4600, who: 'caller', text: '채원이 녹음 앱 켜 놓고 들어갔어요. 마지막 녹음이 그 폰에 있을 거예요.', voice: 'male' },
      { at: 9800, who: 'caller', text: '경찰은 장난이래요. 근데 그 녹음 들어 보면… 알 거예요.', voice: 'male' },
      { at: 14200, who: 'sfx', text: '(지지직—)' },
      { at: 15400, who: 'caller', text: '두 시 전에는 그 폰 꺼요. 꼭이요. 두 시 전에—', voice: 'male' },
      { at: 19000, who: 'sfx', text: '(잡음)' },
      { at: 20600, who: 'other', text: '끄지 마세요.', voice: 'entity' },
      { at: 23000, who: 'sfx', text: '(통화 종료)' },
    ],
  },
  radio: {
    id: 'radio',
    from: '1340',
    label: '1340',
    duration: 0,
    lines: [
      { at: 300, who: 'sfx', text: '(라디오 잡음)' },
      { at: 3000, who: 'other', text: '공공일.', voice: 'entity' },
      { at: 5000, who: 'other', text: '공공삼.', voice: 'entity' },
      { at: 7000, who: 'other', text: '공공칠.', voice: 'entity' },
      { at: 9000, who: 'other', text: '일삼.', voice: 'entity' },
      { at: 12000, who: 'other', text: '…방문자, 공공이칠.', voice: 'entity' },
      { at: 15500, who: 'sfx', text: '(통화 종료)' },
    ],
  },
  line0200: {
    id: 'line0200',
    from: '0200',
    label: '0200',
    duration: 0,
    lines: [
      { at: 600, who: 'sfx', text: '(숨소리)' },
      { at: 4200, who: 'other', text: '지금 몇 시예요?', voice: 'entity' },
      { at: 7600, who: 'other', text: '…아직이네요.', voice: 'entity' },
      { at: 10000, who: 'sfx', text: '(통화 종료)' },
    ],
  },
};
