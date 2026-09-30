// Gallery, notes and voice memos on 채원's phone.

export interface PhotoItem {
  id: string;
  time: string;
  caption: string;
  album: 'recent' | 'hidden';
  portrait?: boolean;
  /** Only appears once the story adds it (save.photos). */
  extra?: boolean;
  /** A video clip rather than a photo. */
  video?: boolean;
  /** Taken tonight, after midnight (default: 9월 27일, the night 채원 went in). */
  date?: string;
}

export const PHOTOS: PhotoItem[] = [
  { id: 'p00', time: '00:58', caption: '제보 진짜였음. 부스 선반에 폰이 있다.', album: 'recent' },
  { id: 'p01', time: '00:59', caption: '정문. 체인이 끊어져 있다.', album: 'recent' },
  { id: 'p02', time: '01:14', caption: '1층 현관. 층별 안내판.', album: 'recent' },
  { id: 'p03', time: '01:25', caption: '3층으로 가는 계단.', album: 'recent' },
  { id: 'v01', time: '01:25', caption: '(복구된 동영상 · 01:13부터 찍던 영상 중 10초)', album: 'recent', portrait: true, extra: true, video: true },
  { id: 'p04', time: '01:32', caption: '3층 복도. 불 켜진 방 하나.', album: 'recent' },
  { id: 'p05', time: '01:40', caption: '열람실. 아무도 없어야 한다.', album: 'recent' },
  { id: 'p06', time: '01:45', caption: '벽에 붙어 있던 평면도.', album: 'recent' },
  { id: 'p07', time: '01:59', caption: '(노출 부족)', album: 'recent', portrait: true },
  { id: 'p08', time: '01:39', caption: '(자동 백업) 3층 창문', album: 'recent', extra: true, date: '9월 28일' },
  { id: 'p09', time: '01:53', caption: '(도현이 보낸 사진)', album: 'recent', extra: true, date: '9월 28일' },
  { id: 'h01', time: '01:53', caption: '제2서고. 벽돌이… 안에서 쌓여 있다.', album: 'hidden' },
  { id: 'h02', time: '01:55', caption: '들어왔다. 어떻게 들어왔는지 모르겠다.', album: 'hidden' },
  { id: 'h03', time: '01:56', caption: '서랍 안에 내 카드가 있었다.', album: 'hidden' },
  { id: 'h04', time: '01:58', caption: '', album: 'hidden', portrait: true },
  { id: 'h05', time: '01:58', caption: '', album: 'hidden', portrait: true },
];

export const HIDDEN_ALBUM_CODE = '1340';

export interface NoteItem {
  id: string;
  title: string;
  date: string;
  body: string;
}

export const NOTES: Record<string, NoteItem> = {
  n1: {
    id: 'n1',
    title: '영상 대본 — 새벽 2시에 가면 안 되는 곳',
    date: '9월 26일',
    body: `오프닝: 정문 앞에서 "안녕하세요 밤채널입니다"
01:13 입장 (도현이랑 처음 만난 날 = 폰 비번 ㅎㅎ 시각 화면에 박기!!)
- 1층 현관 → 계단 → 3층 도서관
- 불 켜진 방 있으면 대박
- 제2서고 앞에서 2시까지 대기 → 엔딩

※ 도현이 입구에서 대기. 무서우면 전화하기`,
  },
  n2: {
    id: 'n2',
    title: '괴담 정리',
    date: '9월 26일',
    body: `1994년 3월 14일. 해원고등학교 도서관 야간 사서 서미령(41) 혼자 야근하다 실종.
열람실 시계는 02:00에 멈춰 있었음. 외투는 의자에.

같은 주, 해원방송 AM 1340에서 매일 새벽 2시에 61초 무음.
그 아래로 여자 목소리가 숫자를 읽음 →
"공공일. 공공삼. 공공칠. 일삼."

→ '심야 기록보관소' 사이트에서 기록을 이 순서대로 열면
   원래 없는 기록이 나온다는 소문 (확인해 보기)
→ 그 주파수 숫자로 전화를 걸면 지금도 그 목소리가
   받는다는 얘기도 있음 ㅋㅋ 무서워서 안 해봄

1995년 폐교. 도서관 제2서고는 봉인.
"새벽 2시에 학교 안에 있으면 도서관에 갇힌다.
 다음 사람이 들어와야 나올 수 있다"`,
  },
  n3: {
    id: 'n3',
    title: '비번들 (보지 마)',
    date: '9월 26일',
    body: `폰: 도현이랑 처음 만난 날 ㅎㅎ
숨김 앨범: 그 방송 주파수 ㅋㅋ (까먹지 말 것)
채널 계정: 도현이한테 물어보기`,
  },
  n5: {
    id: 'n5',
    title: '주운 폰',
    date: '9월 27일 00:58',
    body: `부스 선반에 진짜 폰 있었음!! (제보자 말대로)
잠금 화면 이름: 박현우
배터리 12% — 켜 두는데도 안 떨어짐?? 이상함

잠금 화면에 알림 계속 옴. 저장 안 된 번호.
"들어오세요."
"들어오세요."

ㅋㅋ 누가 연출하는 거면 대박. 영상에 넣기
촬영 끝나면 경찰서에 갖다주기`,
  },
  n4: {
    id: 'n4',
    title: '(제목 없음)',
    date: '오늘',
    body: `방문자 #0027
이름: {name}
들어옴: {start} (폰을 주운 시각)
열람: 사진 {photos}장, 녹음 {memos}개

02:00까지 얼마 남지 않았습니다.`,
  },
};

export interface MemoLine {
  at: number; // seconds
  who: '채원' | '???' | '';
  text: string;
  sfx?: 'footsteps' | 'drawer' | 'whisper' | 'scream' | 'static' | 'key';
}

export const MEMO_M1 = {
  id: 'm1',
  title: '새 녹음 17',
  date: '9월 27일 01:52',
  duration: 48,
  lines: [
    { at: 0, who: '', text: '(발소리. 숨소리. 주머니 속에서 진동.)', sfx: 'footsteps' },
    { at: 3, who: '채원', text: '…주운 폰이 또 울려. 또 그 번호야.' },
    { at: 7, who: '채원', text: '지금 3층이고요. 불 켜진 방이… 열람실이에요.' },
    { at: 13, who: '', text: '(멀리서 서랍 여는 소리)', sfx: 'drawer' },
    { at: 17, who: '채원', text: '거기… 누구 있어요?' },
    { at: 22, who: '', text: '(정적)' },
    { at: 27, who: '???', text: '…방문자세요?', sfx: 'whisper' },
    { at: 31, who: '채원', text: '…네?' },
    { at: 34, who: '???', text: '앉으세요. 두 시에 이름을 적어요.' },
    { at: 40, who: '채원', text: '(떨리는 숨) 도현아…' },
    { at: 44, who: '', text: '(비명)', sfx: 'scream' },
  ] as MemoLine[],
};

export const MEMO_TITLES: Record<string, string> = { m1: '새 녹음 17', m2: '새 녹음 18' };
