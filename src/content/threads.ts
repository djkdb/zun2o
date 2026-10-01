import type { ChatMsg, ThreadId } from '../engine/types';

// 폰에 원래 남아 있던 대화. 게임이 진행되면서 새 메시지가 뒤에 붙는다.

export interface ThreadMeta {
  id: ThreadId;
  name: string;
  avatar: string;
  color: string;
}

export const THREAD_META: Record<ThreadId, ThreadMeta> = {
  dohyun: { id: 'dohyun', name: '도현', avatar: '도', color: '#3d6fd6' },
  mom: { id: 'mom', name: '엄마 ❤️', avatar: '엄', color: '#d65b8a' },
  self: { id: 'self', name: '나에게', avatar: '나', color: '#5b8a5b' },
  unknown: { id: 'unknown', name: '발신자 정보 없음', avatar: '?', color: '#2a2a2a' },
};

export const THREAD_ORDER: ThreadId[] = ['unknown', 'dohyun', 'mom', 'self'];

/** 9월 27일 — the night the phone is found. Everything that arrives during play belongs to it. */
const TONIGHT = 9 * 31 + 27;
const WEEKDAY: Record<number, string> = { 24: '수', 26: '금', 27: '토', 28: '일' };

/**
 * The day (9 * 31 + d) and minute of every message in a thread, on one timeline.
 * Messages only carry HH:MM: history has day labels (a time earlier than the one
 * before it means the night rolled past midnight); anything sent during play is
 * tonight — evening times on the 27th, after-midnight times on the 28th.
 */
export function timeline(msgs: ChatMsg[]): { day: number; at: number }[] {
  let day = 0;
  let prev = -1;
  return msgs.map((m) => {
    const [h, min] = m.time.split(':').map(Number);
    const hm = h * 60 + min;
    const d = m.day && /(\d+)월 (\d+)일/.exec(m.day);
    if (!m.id.startsWith('h')) day = hm >= 12 * 60 ? TONIGHT : TONIGHT + 1;
    else if (d) day = Number(d[1]) * 31 + Number(d[2]);
    else if (hm < prev) day += 1;
    prev = hm;
    return { day, at: day * 1440 + hm };
  });
}

/** When a thread's last message was sent, in minutes on one timeline. */
export function lastSent(msgs: ChatMsg[]): number {
  return timeline(msgs).at(-1)?.at ?? -1;
}

/** '9월 28일 (일)' for a timeline day. */
export function dayLabel(day: number): string {
  const d = day - 9 * 31;
  return `9월 ${d}일 (${WEEKDAY[d] ?? ''})`;
}

/** The phone's date tonight: the 27th until midnight, the 28th after. */
export function today(clock: string): { d: number; weekday: string } {
  const d = Number(clock.split(':')[0]) >= 12 ? 27 : 28;
  return { d, weekday: `${WEEKDAY[d]}요일` };
}

let n = 0;
const m = (from: ChatMsg['from'], time: string, text: string, day?: string): ChatMsg => ({ id: `h${n++}`, from, time, text, day });

const D24 = '9월 24일 (수)';
const D26 = '9월 26일 (금)';
const D27 = '9월 27일 (토)';

export const INITIAL_THREADS: Record<ThreadId, ChatMsg[]> = {
  dohyun: [
    m('me', '20:31', '오늘 밤 해원고 폐교 간다 🔦', D26),
    m('them', '20:32', '거기 진짜 가? 새벽 2시 괴담 있는 데?'),
    m('me', '20:33', 'ㅇㅇ 제보 메일 왔거든. 정문 앞 공중전화 부스에 누가 폰을 두고 갔대'),
    m('me', '20:33', '작년에 거기서 실종된 대학생 폰이래 ㄷㄷ 그거 줍는 게 오프닝'),
    m('them', '20:35', '그걸 왜 주워… 나 안에는 안 들어간다. 입구까지만'),
    m('me', '00:58', '헐 전화부스에 진짜 폰 있음 ㅋㅋㅋ 배터리 12%'),
    m('me', '00:59', '잠금 화면에 발신자 정보 없음으로 계속 알림 옴. "들어오세요"래 ㅋㅋ 연출 미쳤다'),
    m('them', '01:00', '야 그거 내려놔. 기분 나빠'),
    m('me', '01:13', '들어간다. 1시간 안에 나올게'),
    m('them', '01:20', '괜찮아?'),
    m('me', '01:31', '3층에 불 켜진 방 있어. 전기 끊긴 건물인데'),
    m('them', '01:31', '야 그냥 나와'),
    m('me', '01:44', '열람실에 누가 있었어. 뛰쳐나왔는데 복도 끝에서 서랍 여는 소리'),
    m('me', '01:52', '도현아 여기 누가 있어'),
    m('me', '01:52', '사람인지 모르겠어'),
    m('me', '01:58', '시계가 멈췄어'),
    m('me', '01:59', '문이 없어'),
    m('them', '02:00', '채원아'),
    m('them', '02:03', '채원아 전화 받아'),
    m('them', '02:10', '나 들어간다'),
    m('them', '02:41', '3층에 아무도 없어'),
    m('them', '02:42', '제2서고 문은 벽돌로 막혀 있어. 너 어디야'),
    m('them', '02:55', '경찰 불렀어'),
    m('them', '09:12', '경찰은 네가 장난치는 거래. 영상 올리려고 숨어 있는 거 아니냐고', D27),
    m('them', '23:46', '채원이 폰 위치가 방금 다시 떴어요. 정문 앞 전화부스. 낮에 경찰이랑 갔을 땐 선반에 아무것도 없었어요'),
    m('them', '23:48', '이 폰 가지고 계신 분, 제발 연락 주세요'),
    m('them', '23:49', '채원이 폰 맞죠? 제발 받아 주세요'),
    m('them', '23:50', '잠겨 있으면 비번 알려 드릴게요'),
    m('system', '23:50', '메시지가 삭제되었습니다.'),
    m('them', '23:50', '걔가 어제 학교 들어간 시간이랑 똑같아요. 일부러 그 시간 맞춰서 들어갔거든요'),
    m('them', '23:51', '방금 비번 보낸 거 왜 지워졌지?? 다시 보낼게요'),
  ],
  mom: [
    m('them', '21:14', '채원아 토요일 저녁에 올 수 있지? 엄마 생일이라 미역국 끓일게', D24),
    m('me', '21:30', '당연하지!! 케이크는 내가 사 갈게 🎂'),
    m('me', '21:31', '근데 금요일 밤에 촬영 있어서 토요일 낮엔 좀 잘 수도 ㅋㅋ'),
    m('them', '21:33', '또 그 무서운 거 찍니 ㅎㅎ 조심해서 다녀'),
    m('them', '19:02', '채원아 저녁은 먹었니', D26),
    m('me', '19:40', '응 먹었어 오늘 촬영 늦게 끝나'),
    m('them', '19:41', '너무 위험한 데는 가지 마'),
    m('them', '07:30', '채원아 왜 전화를 안 받아', D27),
    m('them', '12:04', '경찰서에서 연락 왔어'),
    m('them', '17:40', '미역국 끓여 놨어. 케이크 같은 거 안 사 와도 돼'),
    m('them', '18:20', '엄마가 잔소리해서 미안해. 전화 한 통만 해 줘'),
    m('them', '23:10', '우리 딸 어디 있니'),
  ],
  self: [
    m('me', '15:20', '촬영 체크리스트: 보조배터리, 손전등, 녹음 앱 켜 두기!!', D26),
    m('me', '15:31', '괴담 요약 → 메모 앱에 정리함'),
    m('me', '15:40', '숨김 앨범 비번 바꿈. 힌트는 메모에'),
  ],
  unknown: [m('them', '02:00', '방문해 주셔서 감사합니다.', D27)],
};

export const INITIAL_UNREAD: Record<ThreadId, number> = { dohyun: 14, mom: 6, self: 0, unknown: 1 };
