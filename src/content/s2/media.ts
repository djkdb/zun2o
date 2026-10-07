import type { MemoLine, NoteItem, PhotoItem } from '../media';

// 시즌 2 — 소연의 사진, 메모, 녹음.
// The 'hidden' album is 소연's "노트" album: not locked, just put away.

export const PHOTOS_S2: PhotoItem[] = [
  { id: 's2-old', time: '16:20', caption: '엄마랑 나. 1994년 3월, 엄마 도서관에서. 이 사진이 엄마 마지막 사진이었다.', album: 'recent', portrait: true, date: '1994년 3월' },
  { id: 's2-sisters', time: '14:05', caption: '엄마랑 나. 올봄. 가게 아줌마가 자매냐고 물었다. 엄마가 웃었다.', album: 'recent', date: '4월 12일' },
  { id: 's2-home', time: '06:10', caption: '엄마 돌아온 날. 식탁에 앉아서 한참 아무 말도 안 했다. 외투도 그대로.', album: 'recent', date: '2025년 9월 28일' },
  { id: 's2-kitchen', time: '01:57', caption: '8월 28일. 엄마. (몰래 찍음)', album: 'recent', date: '8월 28일' },
  { id: 's2-booth', time: '22:55', caption: '여기 두고 간다. 누군가 주울 때까지.', album: 'recent', date: '9월 27일' },
  // 01:52 tonight: taken by this phone — which is in the booth. Location: home.
  { id: 's2-kitchen2', time: '01:52', caption: '(이 폰으로 촬영됨 · 촬영 위치: 집)', album: 'recent', extra: true, video: true, date: '9월 28일' },
  { id: 's2-n1', time: '01:21', caption: '노트 첫 장. 맨 위 줄은 엄마가 1994년에 쓴 것과 같은 글씨.', album: 'hidden', portrait: true, date: '9월 2일' },
  { id: 's2-n2', time: '01:22', caption: '둘째 장. 8월 28일 — 강도현.', album: 'hidden', portrait: true, date: '9월 2일' },
  { id: 's2-n3', time: '22:31', caption: '오늘 밤 페이지. 연필로 먼저 적혀 있다. 엄마는 두 시에 그 위를 볼펜으로 덧쓴다.', album: 'hidden', portrait: true, date: '9월 27일' },
];

/** The eleven names, one a month on the 28th at 02:00. */
export const NOTEBOOK: [string, string][] = [
  ['10월 28일', '이정훈'],
  ['11월 28일', '김수아'],
  ['12월 28일', '오민재'],
  ['1월 28일', '박지윤'],
  ['2월 28일', '최은호'],
  ['3월 28일', '장하늘'],
  ['4월 28일', '정다은'],
  ['5월 28일', '윤석진'],
  ['6월 28일', '서지안'],
  ['7월 28일', '문태오'],
  ['8월 28일', '강도현'],
];

export const NOTES_S2: Record<string, NoteItem> = {
  s2n1: {
    id: 's2n1',
    title: '이 폰을 주운 사람에게',
    date: '9월 27일 22:50',
    body: `한소연이에요. 이 폰 일부러 두고 가요.

오늘 밤 노트에 제 이름이 있어요. 엄마 글씨로요.
노트는 사진으로 찍어 뒀어요. 앨범 이름이 '노트'예요.

엄마한테는 아무 말도 하지 말아 주세요.

부탁이 하나 있어요. 두 시 전에

(동기화 오류: 이후 내용이 손상되었습니다)`,
  },
  s2n2: {
    id: 's2n2',
    title: '엄마 — 기록',
    date: '9월 3일',
    body: `9/28 (작년) 06:10 엄마 귀가. 1994년 옷. 외투. 나이 그대로.
엄마는 31년을 기억 못 함. "도서관에 잠깐 있었는데."

10/28 01:59 엄마가 자다가 일어나 식탁에서 뭘 씀.
아침에 보니 노트에 "10월 28일 02:00 — 이정훈".
→ 해원일보: 해원동 20대 남성 실종 (10/28)

11/28 01:59 또. "김수아".
11/28 아침, 이정훈 씨가 정문 전화부스에서 잠든 채 발견됨.
→ 다음 이름이 적히면 앞사람이 나온다. 작년 그 기록이랑 같다.

엄마는 깨어나면 아무것도 모름. 손에 잉크만 묻어 있음.
노트를 버려도 다음 달 28일이면 식탁 위에 돌아와 있음.

8/28 "강도현". 채원이한테 말 못 하겠다.`,
  },
  s2n3: {
    id: 's2n3',
    title: '보관소',
    date: '9월 3일',
    body: `심야 기록보관소 관리자 페이지 (보관소 관리 앱)
비번: 엄마 돌아온 날

원본 출입 기록은 작년에 지워졌다.
2004년에 내가 스캔해 둔 기록 013은 그냥 사본이었다. 원본이 없어지고 나서 이게 원본 노릇을 한다.
→ 기록이 남아 있으니까 엄마 손을 빌리는 거다.

2004년부터 매년 3월 14일 02:00에 정문 부스에서 코드랑 엄마 이름을 넣었다. 스무 번. 한 번도 안 됐다.
작년에 남이 넣으니까 됐다. 그래서 알았다. 시작한 사람은 못 지운다.

사본 삭제 안 됨. "이 기록을 시작한 사람은 삭제할 수 없습니다."
2004년에 스캔할 때 실종 신고서를 첫 장으로 묶었다. 그래서 이 사본의 첫 줄은 내 말이다. 열한 살 때 경찰서에서 한 말.`,
  },
  s2n4: {
    id: 's2n4',
    title: '작년 그 밤의 방문자',
    date: '9월 5일',
    body: `방문자 #0027 — {s1name}
작년 9월 28일 02:00, 기록 013을 끝까지 열어 본 사람.
엄마 이름을 불러 준 사람.

연락처는 모른다. 고맙다는 말을 못 했다.
그래서 1년째 되는 밤, 같은 시각에 거기 둔다. 그분이 오면 좋겠다.`,
  },
};

/** 22:47 at the school gate: 소연, just before she leaves the phone on the shelf. */
export const MEMO_S2M2 = {
  id: 's2m2',
  title: '9월 27일 22:57',
  date: '9월 27일 22:57',
  duration: 41,
  lines: [
    { at: 0, who: '', text: '(빗소리. 철문 체인이 흔들리는 소리.)', sfx: 'static' },
    { at: 3, who: '소연', text: '…녹음 되나. 됐다.' },
    { at: 6, who: '소연', text: '이거 듣는 분. 제 폰 주운 분이요. 한소연이에요.' },
    { at: 11, who: '소연', text: '아까 명단 맨 위에 제 이름 올려놨어요. …그건 되더라고요.' },
    { at: 17, who: '소연', text: '엄마한테는 일이 좀 늦는다고 했어요. 먼저 자라고.' },
    { at: 23, who: '', text: '(긴 숨)' },
    { at: 25, who: '소연', text: '사본은요, 지우면—' },
    { at: 28, who: '', text: '(정적)' },
    { at: 31, who: '소연', text: '…아니에요. 두 시 전에는 끝나요.' },
    { at: 34, who: '', text: '(휴대폰을 선반에 내려놓는 소리)', sfx: 'key' },
    { at: 36.5, who: '소연', text: '(멀어지며) 엄마. 나 두 시 전에는 와.' },
  ] as MemoLine[],
};

/** 1994년 3월 13일 23:38, the answering machine: the promise the eleven-year-old repeated to the police. */
export const MEMO_S2TAPE = {
  id: 's2tape',
  title: '엄마 목소리',
  date: '1994년 3월 13일 23:38 · 자동응답기 테이프',
  duration: 10,
  lines: [
    { at: 0, who: '', text: '(자동응답기 삑 소리. 테이프 잡음.)', sfx: 'static' },
    { at: 2, who: '엄마', text: '소연아, 엄마야. 도서관 정리가 좀 늦어.' },
    { at: 5.5, who: '엄마', text: '먼저 자. 엄마 두 시 전에는 와.' },
    { at: 8.6, who: '', text: '(삑)' },
  ] as MemoLine[],
};

export const MEMO_S2M1 = {
  id: 's2m1',
  title: '8월 28일 01:58',
  date: '8월 28일 01:58',
  duration: 34,
  lines: [
    { at: 0, who: '', text: '(냉장고 소리. 아주 조용하다.)', sfx: 'static' },
    { at: 2.5, who: '소연', text: '8월 28일. 1시 58분. 엄마가 또 일어났어.' },
    { at: 7, who: '', text: '(의자 끄는 소리)' },
    { at: 9, who: '소연', text: '엄마?' },
    { at: 11, who: '엄마', text: '앉으세요. 두 시에 이름을 적어요.' },
    { at: 15.5, who: '', text: '(볼펜 소리)', sfx: 'key' },
    { at: 17.5, who: '소연', text: '엄마, 누구 이름 써?' },
    { at: 20, who: '엄마', text: '다 적어 뒀어요.' },
    { at: 23, who: '엄마', text: '(작게) 강… 도… 현.', sfx: 'whisper' },
    { at: 27, who: '', text: '(볼펜이 바닥에 떨어지는 소리)' },
    { at: 29.5, who: '엄마', text: '…소연아? 엄마가 왜 여기 있니.' },
  ] as MemoLine[],
};
