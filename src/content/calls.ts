import type { CallScript } from '../engine/types';
import { CALLS_S2 } from './s2/calls';

export const CALLS: Record<string, CallScript> = {
  // Two seconds after you pick the phone up: she calls it, and leaves the door open as a riddle.
  door: {
    id: 'door',
    from: '0200',
    label: '발신자 정보 없음',
    duration: 0,
    lines: [
      { at: 500, who: 'sfx', text: '(숨소리)' },
      { at: 2200, who: 'other', text: '…들려요?', voice: 'entity' },
      { at: 4600, who: 'other', text: '문은 열어 뒀어요.', voice: 'entity' },
      { at: 7000, who: 'other', text: '채원 씨도 어젯밤 이 전화를 받았어요.', voice: 'entity' },
      { at: 10400, who: 'sfx', text: '(통화 종료)' },
    ],
  },
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
      { at: 500, who: 'caller', text: '…학교 앞 전화부스에서 주운 거죠? 지금 전화부스 안이에요? 문… 열려요?', voice: 'male' },
      { at: 4600, who: 'caller', text: '채원이 녹음 앱 켜 놓고 들어갔어요. 마지막 녹음이 클라우드에 올라와 있어요. 보내 드릴게요.', voice: 'male' },
      { at: 9800, who: 'caller', text: '경찰은 장난이래요. 근데 그 녹음 들어 보면… 알 거예요.', voice: 'male' },
      { at: 14200, who: 'sfx', text: '(지지직—)' },
      { at: 15400, who: 'caller', text: '두 시 전에는 그 폰 꺼요. 꼭이요. 두 시 전에—', voice: 'male' },
      { at: 19000, who: 'sfx', text: '(잡음)' },
      { at: 20600, who: 'other', text: '끄지 마세요.', voice: 'entity' },
      { at: 23000, who: 'sfx', text: '(통화 종료)' },
    ],
  },
  dohyun2: {
    id: 'dohyun2',
    from: 'dohyun',
    label: '도현',
    duration: 0,
    lines: [
      { at: 700, who: 'caller', text: '(숨소리) …들려요? 저 제2서고 안이에요.', voice: 'male' },
      { at: 4000, who: 'caller', text: '서랍이 끝이 없어요. 채원이 목소리가 계속 저 안쪽에서—', voice: 'male' },
      { at: 7800, who: 'sfx', text: '(서랍 수백 개가 한꺼번에 열리는 소리)' },
      { at: 9400, who: 'other', text: '끄지 마세요.', voice: 'entity' },
      { at: 11600, who: 'other', text: '도현 씨 목소리, 비슷했죠?', voice: 'entity' },
      { at: 14600, who: 'sfx', text: '(통화 종료)' },
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
  // 시즌 2
  ...CALLS_S2,
};

/** 02:00, 채원's video call (Finale): what she says, in order. */
export const VIDEO_CALL_LINES = ['…들려?', '여기 너무 어두워. 서랍 소리가 멈추질 않아', '잠깐. 네 카메라… 네 뒤에도—'] as const;
