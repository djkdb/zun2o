import type { ChatMsg, ThreadId } from '../../engine/types';
import type { ThreadMeta } from '../threads';

// 시즌 2 — 소연의 폰에 남아 있던 대화.
// The four thread slots are reused: 'mom' is 엄마 (서미령), 'dohyun' is 채원,
// 'self' is 소연's 나에게, 'unknown' is still 발신자 정보 없음.

export const THREAD_META_S2: Record<ThreadId, ThreadMeta> = {
  mom: { id: 'mom', name: '엄마', avatar: '엄', color: '#a4785a' },
  dohyun: { id: 'dohyun', name: '채원', avatar: '채', color: '#c4577a' },
  self: { id: 'self', name: '나에게', avatar: '나', color: '#5b8a5b' },
  unknown: { id: 'unknown', name: '발신자 정보 없음', avatar: '?', color: '#2a2a2a' },
};

export const THREAD_ORDER_S2: ThreadId[] = ['mom', 'dohyun', 'unknown', 'self'];

let n = 0;
const m = (from: ChatMsg['from'], time: string, text: string, day?: string): ChatMsg => ({ id: `hs2${n++}`, from, time, text, day });

export const INITIAL_THREADS_S2: Record<ThreadId, ChatMsg[]> = {
  // 엄마 learned to text this year. 1994 words, slow thumbs, no emoji.
  mom: [
    m('them', '19:02', '소연아 엄마 문자 보내는거 배웠다', '1월 9일'),
    m('me', '19:10', '엄마 잘했어!! 이제 매일 보내'),
    m('them', '19:16', '응. 근데 글씨가 너무 작다'),
    m('them', '07:40', '소연아 눈 온다. 우산 가져가라', '2월 3일'),
    m('me', '07:52', '엄마 나 마흔둘이야 ㅋㅋ'),
    m('them', '07:53', '엄마한테는 열한살이다'),
    m('them', '02:14', '소연아 자니', '3월 28일'),
    m('them', '02:15', '엄마가 또 뭘 썼나보다. 손에 볼펜 잉크가 묻어있다'),
    m('me', '07:02', '괜찮아 엄마. 내가 치웠어'),
    m('them', '14:20', '오늘 학교 앞에 가봤다. 공중전화가 아직 있더라', '5월 2일'),
    m('me', '14:31', '엄마 거기 가지 말라니까'),
    m('them', '14:33', '미안하다'),
    m('them', '21:05', '소연아 엄마 노트 어디 갔니. 식탁 위에 둔거', '8월 27일'),
    m('me', '21:20', '버렸어. 엄마 이제 그거 안 써도 돼'),
    m('them', '21:21', '엄마가 안 쓰면 누가 쓰니'),
    m('them', '02:03', '미안하다 소연아', '8월 28일'),
    m('them', '02:03', '엄마 손이 또 썼다'),
    m('them', '02:04', '강도현 이라고 썼다'),
    m('them', '22:40', '소연아 어디 가니', '9월 27일'),
    m('them', '23:10', '엄마 노트 니가 가져갔지'),
    m('them', '23:30', '소연아 학교 가지마'),
    m('them', '23:48', '엄마가 두시 전에는 집에 오라고 했잖아'),
  ],
  // 채원: last year she was the one inside. This year 도현 is.
  dohyun: [
    m('them', '20:12', '언니 내일이 1년이네요', '9월 26일'),
    m('me', '20:20', '응. 채원아 내일 밤엔 아무 데도 가지 마'),
    m('them', '20:21', '언니야말로요'),
    m('them', '20:22', '도현이 한 달째예요. 오늘 밤 두 시에 다음 이름이 적히면 돌아온다면서요'),
    m('me', '20:40', '응. 돌아올 거야'),
    m('them', '20:41', '근데 다음 이름이 누구예요?'),
    m('me', '20:58', '몰라도 돼'),
    m('them', '23:20', '언니 왜 전화 안 받아요', '9월 27일'),
    m('them', '23:41', '어머니가 저한테 전화하셨어요. 언니가 학교 갔대요'),
    m('them', '23:47', '언니 폰 위치가 정문 전화부스로 떠요'),
    m('them', '23:49', '이 폰 주운 분, 제발 연락 주세요. 소연 언니 폰이에요'),
    m('them', '23:50', '언니 비번 아직 어머니 사라지신 날이죠? 바꾸라고 그렇게 말했는데'),
  ],
  self: [
    m('me', '01:20', '엄마 노트 사진 찍어 둠 → 사진 앱 "노트" 앨범', '9월 2일'),
    m('me', '01:31', '열한 명. 한 달에 한 명. 매달 28일 01:59.'),
    m('me', '09:12', '보관소 관리자 비번도 엄마 돌아온 날로 바꿈. 이제 다 그날이다', '9월 3일'),
    m('me', '22:40', '오늘 밤 페이지에 내 이름이 미리 적혀 있다', '9월 27일'),
    m('me', '22:41', '엄마가 쓰기 전에 내가 먼저 간다'),
    m('me', '22:52', '이 폰을 주운 사람에게. 메모 앱 맨 위에 적어 뒀어요'),
  ],
  unknown: [m('them', '02:00', '이번 달 이름은 정해졌어요.', '8월 28일'), m('them', '02:00', '다시 방문해 주세요.')],
};

export const INITIAL_UNREAD_S2: Record<ThreadId, number> = { mom: 4, dohyun: 5, self: 0, unknown: 1 };
