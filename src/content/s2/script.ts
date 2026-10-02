import type { Beat } from '../../engine/types';

// ─────────────────────────────────────────────────────────────────────────
// 「12%」 시즌 2 — 귀가. The story as beats (same engine as season 1).
// The 'dohyun' thread is 채원 this season; 'mom' is 엄마 (서미령); 'self' is
// 소연's 나에게. {s1name} / {typed1}: what the phone remembers of your season 1.
//
//   0 잠금      23:51  소연's phone, the door that won't close → 0314
//   1 엄마      23:52  the letter, the notebook album
//   2 노트      00:40  the recording of 엄마 at 01:58 → your name
//   3 관리자    01:12  the archive admin app → 0928, the copy, the first sentence
//   4 두 시 전  01:50  엄마 calls, the note writes itself, 소연 from inside
//   5 02:00            finale (phone/Finale2.tsx), endings 4–6
// ─────────────────────────────────────────────────────────────────────────

const CHAEWON = 'dohyun' as const;

export const BEATS_S2: Beat[] = [
  // ── 0. 잠금 ────────────────────────────────────────────────────────────
  {
    id: 's2-start',
    on: 'start',
    actions: [
      { t: 'time', hm: '23:51' },
      { t: 'battery', v: 12 },
      {
        t: 'objective',
        text: '소연의 폰 잠금을 풀자',
        hint: '채원의 문자: “어머니 사라지신 날”. 잠금 화면의 해원일보 알림에 그 날짜가 있어요. 월과 일, 네 자리로.',
      },
      { t: 'wait', ms: 2600 },
      { t: 'msg', th: 'unknown', text: '1년 만이네요.', typing: 1200 },
    ],
  },
  { id: 's2-lock-idle', on: 'lock:idle', forbids: ['unlocked'], actions: [{ t: 'msg', th: 'mom', text: '소연아 왜 대답이 없니' }] },
  { id: 's2-lock-idle2', on: 'lock:idle2', forbids: ['unlocked'], actions: [{ t: 'msg', th: 'unknown', text: '이번엔 문이 안 닫혔죠? 나가도 돼요. 아무도 안 막아요.' }] },
  { id: 's2-lock-fail3', on: 'lock:fail3', forbids: ['unlocked'], actions: [{ t: 'msg', th: CHAEWON, text: '0314요. 언니 어머니 사라지신 날. 제발 열어 주세요' }] },

  // ── 1. 엄마 ────────────────────────────────────────────────────────────
  {
    id: 's2-unlock',
    on: 'unlock',
    actions: [
      { t: 'flag', f: 'unlocked' },
      { t: 'time', hm: '23:52' },
      { t: 'chapter', n: 1, title: '엄마' },
      {
        t: 'objective',
        app: 'notes',
        text: '소연이 남긴 메모를 읽자',
        hint: '메모 앱 맨 위: “이 폰을 주운 사람에게”.',
        nudge: { th: CHAEWON, text: '혹시 폰 여셨어요? 언니가 주운 사람한테 메모 남긴다고 했었어요' },
      },
      { t: 'wait', ms: 1800 },
      { t: 'msg', th: 'unknown', text: '들어왔네요. 이번엔 소연 씨 폰이에요.', typing: 1600 },
    ],
  },
  // It remembers you.
  {
    id: 's2-remembers',
    on: 'unlock',
    requires: ['s1-name'],
    actions: [{ t: 'wait', ms: 30000 }, { t: 'msg', th: 'unknown', text: '작년에도 왔었죠, {s1name} 씨. 그때도 이 시간이었어요.', typing: 1800 }],
  },
  {
    id: 's2-remembers-typed',
    on: 'note:s2n1',
    requires: ['s1-typed'],
    actions: [{ t: 'wait', ms: 14000 }, { t: 'msg', th: 'unknown', text: '작년에 당신이 저한테 보낸 말, 아직 있어요. “{typed1}”', typing: 2000 }],
  },
  {
    id: 's2-c1',
    on: 'thread:unknown',
    requires: ['unlocked'],
    forbids: ['ch2'],
    actions: [
      { t: 'wait', ms: 900 },
      { t: 'msg', th: 'unknown', text: '그 폰, 이번엔 왜 주웠어요?', typing: 1800 },
      {
        t: 'choice',
        th: 'unknown',
        id: 's2c1',
        options: [
          { id: 'who', label: '누구세요?' },
          { id: 'find', label: '소연 씨를 찾으려고요.' },
          { id: 'silent', label: '(대답하지 않는다)', reply: '' },
        ],
      },
    ],
  },
  {
    id: 's2-c1-who',
    on: 'choice:s2c1:who',
    actions: [
      { t: 'msg', th: 'unknown', text: '작년에도 그렇게 물었죠.', typing: 1400 },
      { t: 'msg', th: 'unknown', text: '저는 기록이에요. 쓰던 사람이 집에 가 버려서, 지금은 그 사람 손을 빌려 써요.', typing: 2600 },
    ],
  },
  {
    id: 's2-c1-find',
    on: 'choice:s2c1:find',
    actions: [{ t: 'msg', th: 'unknown', text: '소연 씨는 어디 있는지 알잖아요. 두 시에 거기서 찾을 수 있어요.', typing: 2200 }],
  },
  { id: 's2-c1-silent', on: 'choice:s2c1:silent', actions: [{ t: 'wait', ms: 2400 }, { t: 'msg', th: 'unknown', text: '작년 사람처럼 말이 없네요.', typing: 900 }] },
  {
    id: 's2-letter',
    on: 'note:s2n1',
    actions: [
      { t: 'flag', f: 'read-letter' },
      { t: 'wait', ms: 2600 },
      { t: 'msg', th: 'unknown', text: '뒤가 지워졌죠. 제가 지웠어요.', typing: 1300 },
      {
        t: 'objective',
        app: 'gallery',
        text: '소연이 찍어 둔 노트를 보자',
        hint: '사진 앱 → “노트” 앨범. 마지막 장까지 넘기세요.',
        nudge: { th: 'unknown', text: '노트요. 마지막 장.' },
      },
    ],
  },
  {
    // Look at tonight's page long enough and, while you look, there is one more line.
    id: 's2-n3-more',
    on: 'photo:s2-n3:dwell',
    actions: [
      { t: 'hush', ms: 2200, still: true },
      { t: 'flag', f: 's2-n3-more' },
      { t: 'sound', id: 'key', caption: '종이를 긁는 소리가 감지되었습니다.' },
      { t: 'vibrate', ms: [30] },
      { t: 'wait', ms: 2600 },
      { t: 'msg', th: 'unknown', text: '다음 장도 미리 써 두는 중이에요.', typing: 1400 },
      { t: 'wait', ms: 2000 },
      { t: 'emit', ev: 'ch2' },
    ],
  },
  // swiped past it too quickly: the night moves on anyway
  { id: 's2-n3-seen', on: 'photo:s2-n3', actions: [{ t: 'wait', ms: 14000 }, { t: 'emit', ev: 'ch2' }] },

  // ── 2. 노트 ────────────────────────────────────────────────────────────
  {
    id: 's2-ch2',
    on: 'ch2',
    actions: [
      { t: 'flag', f: 'ch2' },
      { t: 'chapter', n: 2, title: '노트' },
      { t: 'time', hm: '00:40' },
      { t: 'memo', id: 's2m1' },
      { t: 'notify', app: 'memos', title: '녹음', body: '“8월 28일 01:58” 녹음을 클라우드에서 복원했습니다.' },
      { t: 'msg', th: CHAEWON, text: '언니 클라우드에 녹음 하나가 방금 올라왔대요. 언니가 몰래 녹음한 거예요. 어머니요.', typing: 2200, attach: { kind: 'memo', id: 's2m1' } },
      {
        t: 'objective',
        app: 'memos',
        text: '소연이 녹음한 엄마의 목소리를 듣자',
        hint: '녹음 앱 → “8월 28일 01:58”. 소리를 켜고, 이어폰이 있다면 끼세요.',
        nudge: { th: CHAEWON, text: '녹음 들어 보셨어요? 끝까지요' },
      },
    ],
  },
  {
    id: 's2-memo-end',
    on: 'memo:s2m1:end',
    actions: [
      { t: 'flag', f: 'memo-done' },
      { t: 'wait', ms: 1800 },
      { t: 'msg', th: CHAEWON, text: '도현이 이름이에요. 어머니가 쓰신 거', typing: 1600 },
      { t: 'msg', th: CHAEWON, text: '오늘 밤 누가 적히면 도현이가 나와요. 근데 그게 언니면…', typing: 2000 },
      { t: 'wait', ms: 1600 },
      { t: 'msg', th: 'unknown', text: '이름 얘기 나온 김에요.', typing: 1200 },
      { t: 'emit', ev: 's2:ask-name' },
    ],
  },
  {
    id: 's2-ask-name-again',
    on: 's2:ask-name',
    requires: ['s1-name'],
    actions: [
      { t: 'msg', th: 'unknown', text: '작년엔 {s1name}이라고 했죠. 올해도 그 이름이에요?', typing: 2000 },
      {
        t: 'choice',
        th: 'unknown',
        id: 's2c2',
        options: [
          { id: 'same', label: '네. 그 이름이에요.' },
          { id: 'name', label: '다른 이름을 알려 준다', input: 'name' },
          { id: 'no', label: '알려 주지 않는다', reply: '이번엔 싫어요.' },
        ],
      },
      { t: 'objective', app: 'messages', text: '“발신자 정보 없음”이 이름을 묻는다', hint: '메시지 앱 → 발신자 정보 없음. (이름은 이 기기에만 저장됩니다)', nudge: { th: 'unknown', text: '대답해요. 작년처럼.' } },
    ],
  },
  {
    id: 's2-ask-name',
    on: 's2:ask-name',
    forbids: ['s1-name'],
    actions: [
      { t: 'msg', th: 'unknown', text: '당신 이름은 뭐예요?', typing: 1800 },
      {
        t: 'choice',
        th: 'unknown',
        id: 's2c2',
        options: [
          { id: 'name', label: '이름을 알려 준다', input: 'name' },
          { id: 'no', label: '알려 주지 않는다', reply: '싫어요.' },
        ],
      },
      { t: 'objective', app: 'messages', text: '“발신자 정보 없음”이 이름을 묻는다', hint: '메시지 앱 → 발신자 정보 없음. (이름은 이 기기에만 저장됩니다)', nudge: { th: 'unknown', text: '대답해요.' } },
    ],
  },
  { id: 's2-c2-same', on: 'choice:s2c2:same', actions: [{ t: 'flag', f: 'gave-name' }, { t: 'msg', th: 'unknown', text: '{name}. 그대로네요. 적어 둘게요. 작년 것 옆에.', typing: 2200 }, { t: 'emit', ev: 's2c2:done' }] },
  { id: 's2-c2-name', on: 'choice:s2c2:name', actions: [{ t: 'flag', f: 'gave-name' }, { t: 'msg', th: 'unknown', text: '{name}. 적어 둘게요.', typing: 1800 }, { t: 'emit', ev: 's2c2:done' }] },
  { id: 's2-c2-no', on: 'choice:s2c2:no', actions: [{ t: 'flag', f: 'refused-name' }, { t: 'msg', th: 'unknown', text: '괜찮아요. 어머니 손은 이름을 몰라도 써요.', typing: 2000 }, { t: 'emit', ev: 's2c2:done' }] },

  // ── 3. 관리자 ──────────────────────────────────────────────────────────
  {
    id: 's2-ch3',
    on: 's2c2:done',
    actions: [
      { t: 'flag', f: 'ch3' },
      { t: 'chapter', n: 3, title: '관리자' },
      { t: 'time', hm: '01:12' },
      { t: 'install', app: 'index' },
      { t: 'notify', app: 'index', title: '보관소 관리', body: '로그인 유지됨 · 관리자 한소연' },
      { t: 'wait', ms: 1800 },
      { t: 'msg', th: 'unknown', text: '소연 씨가 왜 이 폰을 두고 갔는지 알아요? 자기가 못 하는 걸 시키려고요.', typing: 2400 },
      {
        t: 'objective',
        app: 'index',
        text: '보관소 관리 앱에 들어가자',
        hint: '비번은 메모 “보관소”와 나에게의 “엄마 돌아온 날”. 홈 화면 달력에 그 날짜가 있어요. 월과 일, 네 자리로.',
        nudge: { th: CHAEWON, text: '언니 비번은 다 어머니 날짜예요. 사라지신 날 아니면 돌아오신 날' },
      },
      // The night doesn't wait for the password.
      { t: 'wait', ms: 150000 },
      { t: 'emit', ev: 'ch4' },
    ],
  },
  {
    id: 's2-admin',
    on: 'admin:unlock',
    actions: [
      { t: 'flag', f: 'admin' },
      { t: 'wait', ms: 2400 },
      { t: 'msg', th: 'unknown', text: '대기 명단, 봤어요?', typing: 1000 },
      { t: 'wait', ms: 3200 },
      { t: 'msg', th: 'unknown', text: '사본을 지우면 어머니도 지워져요.', typing: 1600 },
      { t: 'msg', th: 'unknown', text: '어머니가 이 세상에 있는 건 기록이 남아 있어서예요. 소연 씨가 그 말은 안 했죠?', typing: 2600 },
      {
        t: 'objective',
        app: 'index',
        text: '02:00 전에 정하자 — 사본을 지울지',
        hint: '보관소 관리 → 기록 013 (사본) → 삭제. 이 기록에 처음 남은 문장은 실종 신고서(기록 003)의 신고자, 열한 살 소연의 말입니다. 지우지 않아도 02:00은 옵니다.',
      },
      { t: 'wait', ms: 30000 },
      { t: 'emit', ev: 'ch4' },
    ],
  },
  {
    id: 's2-armed',
    on: 'admin:armed',
    actions: [
      { t: 'flag', f: 'copy-armed' },
      { t: 'wait', ms: 1400 },
      { t: 'msg', th: 'unknown', text: '…맞아요. 그게 첫 줄이에요.', typing: 1400 },
      { t: 'msg', th: 'unknown', text: '삭제는 02:00에 실행돼요. 그때 마음이 바뀌어도 돼요. 바뀔 거예요.', typing: 2200 },
    ],
  },
  { id: 's2-wrong', on: 'admin:wrong', actions: [{ t: 'wait', ms: 1200 }, { t: 'msg', th: 'unknown', text: '그건 첫 줄이 아니에요. 열한 살짜리가 경찰서에서 뭐라고 했을까요.', typing: 2000 }] },

  // ── 4. 두 시 전 ────────────────────────────────────────────────────────
  {
    id: 's2-ch4',
    on: 'ch4',
    actions: [
      { t: 'flag', f: 'ch4' },
      { t: 'glitch', ms: 800 },
      { t: 'chapter', n: 4, title: '두 시 전' },
      { t: 'time', hm: '01:50' },
      { t: 'battery', v: 6 },
      {
        t: 'objective',
        text: '02:00에 정해야 한다',
        hint: '02:00에 노트 화면에서 고르게 됩니다. 사본 삭제를 예약해 두었다면(보관소 관리 → 기록 013 사본 → 첫 문장) 그것도 고를 수 있어요.',
      },
      { t: 'msg', th: CHAEWON, text: '저 학교 앞이에요. 도현이 나오는지 보려고요', typing: 1400 },
      { t: 'wait', ms: 7000 },
      { t: 'time', hm: '01:51' },
      { t: 'msg', th: 'mom', text: '소연아 엄마 지금 그 사이트 보고 있다', typing: 1800 },
      { t: 'msg', th: 'mom', text: '엄마 이름이 왜 거기 있니', typing: 1600 },
      { t: 'wait', ms: 8000 },
      { t: 'time', hm: '01:52' },
      { t: 'msg', th: 'unknown', text: '이 폰 시계는 {clock}이지만, 당신 쪽은 {real}이죠? 어머니 쪽은 아직 1994년이에요.', typing: 2200 },
      { t: 'wait', ms: 7000 },
      { t: 'time', hm: '01:53' },
      { t: 'call', id: 'eomma' },
      { t: 'wait', ms: 24000 },
      { t: 'time', hm: '01:55' },
      { t: 'battery', v: 4 },
      { t: 'notify', app: 'notes', title: '메모', body: '새 메모: 9월 28일' },
      { t: 'write', text: '02:00 — 한', ms: 480 },
      { t: 'msg', th: 'unknown', text: '메모 앱 열어 봐요. 어머니 글씨예요.', typing: 1200 },
      { t: 'wait', ms: 8000 },
      { t: 'time', hm: '01:56' },
      { t: 'msg', th: CHAEWON, text: '3층 창문에 언니가 있어요. 손 흔들어요', typing: 1200 },
      { t: 'msg', th: CHAEWON, text: '언니 맞아요. 근데 언니 뒤에', typing: 1000 },
      { t: 'wait', ms: 3000 },
      { t: 'unsend', th: CHAEWON, match: '근데 언니 뒤에' },
      { t: 'wait', ms: 2400 },
      { t: 'time', hm: '01:57' },
      // Inside, phones only reach 나에게 (채원 learned that last year).
      { t: 'flag', f: 'soyeon-contact' },
      { t: 'msg', th: 'self', from: 'me', text: '주웠어요? 제 폰', typing: 1400 },
      { t: 'msg', th: 'self', from: 'me', text: '여기선 나에게로만 보내져요. 작년에 채원이가 그랬어요', typing: 2000 },
      { t: 'msg', th: 'self', from: 'me', text: '지웠어요?', typing: 900 },
      {
        t: 'choice',
        th: 'self',
        id: 's2c5',
        options: [
          { id: 'erase', label: '지울 거예요.' },
          { id: 'ask', label: '정말 당신이 남는 게 맞아요?' },
        ],
      },
      { t: 'wait', ms: 13000 },
      { t: 'unchoice', id: 's2c5' },
      { t: 'time', hm: '01:58' },
      { t: 'battery', v: 3 },
      { t: 'write', text: '소', ms: 900 },
      { t: 'msg', th: 'unknown', text: '1분.', typing: 600 },
      { t: 'wait', ms: 8000 },
      { t: 'time', hm: '01:59' },
      { t: 'hush', ms: 3000 },
      { t: 'wait', ms: 2000 },
      { t: 'finale' },
    ],
  },
  { id: 's2-pretend', on: 'call:eomma:choice:pretend', actions: [{ t: 'flag', f: 'pretended' }] },
  { id: 's2-truth', on: 'call:eomma:choice:truth', actions: [{ t: 'flag', f: 'told-truth' }] },
  { id: 's2-eomma-missed', on: 'call:eomma:decline', actions: [{ t: 'wait', ms: 1200 }, { t: 'msg', th: 'mom', text: '왜 안 받니 소연아', typing: 1200 }, { t: 'msg', th: 'mom', text: '엄마 손이 또 쓴다', typing: 1200 }] },
  {
    id: 's2-c5-erase',
    on: 'choice:s2c5:erase',
    actions: [
      { t: 'flag', f: 'promised' },
      { t: 'msg', th: 'self', from: 'me', text: '고마워요.', typing: 1000 },
      { t: 'msg', th: 'self', from: 'me', text: '엄마한테는 제가 말할게요. …아니, 말 못 하겠다', typing: 2000 },
    ],
  },
  {
    id: 's2-c5-ask',
    on: 'choice:s2c5:ask',
    actions: [
      { t: 'flag', f: 'asked-her' },
      { t: 'msg', th: 'self', from: 'me', text: '엄마는 31년 동안 혼자 여기 있었어요. 이번엔 제 차례예요.', typing: 2200 },
      { t: 'msg', th: 'self', from: 'me', text: '근데 무서워요', typing: 1000 },
    ],
  },

  // ── between the big moments ───────────────────────────────────────────
  { id: 's2-chaewon-blocked', on: 'dohyun:blocked', forbids: ['s2-chaewon-blocked'], actions: [{ t: 'flag', f: 's2-chaewon-blocked' }, { t: 'wait', ms: 1600 }, { t: 'msg', th: 'unknown', text: '채원 씨한테는 안 가요. 이 폰은 오늘 밤 저하고만 얘기해요.', typing: 1500 }] },
  { id: 's2-mom-blocked', on: 'mom:blocked', forbids: ['s2-mom-blocked'], actions: [{ t: 'flag', f: 's2-mom-blocked' }, { t: 'wait', ms: 1600 }, { t: 'msg', th: 'unknown', text: '어머니께는 안 가요. 어머니는 지금 손이 바쁘세요.', typing: 1400 }] },
  { id: 's2-power', on: 'power:try', requires: ['unlocked'], repeat: true, actions: [{ t: 'wait', ms: 900 }, { t: 'msg', th: 'unknown', text: '끄지 마요. 소연 씨가 이 폰에 다 걸었어요.', typing: 1200 }] },
  {
    id: 's2-sees-gallery',
    on: 'app:gallery',
    requires: ['read-letter'],
    forbids: ['ch2'],
    actions: [{ t: 'wait', ms: 5000 }, { t: 'typing', th: 'unknown', ms: 2400 }, { t: 'wait', ms: 3000 }, { t: 'msg', th: 'unknown', text: '1994년 사진도 봐요. 어머니가 웃는 건 그게 마지막이에요.' }] },
  { id: 's2-sees-index', on: 'app:index', requires: ['admin'], actions: [{ t: 'wait', ms: 6000 }, { t: 'msg', th: 'unknown', text: '지금 보는 사람 숫자, 하나 늘었죠. 어머니예요.', typing: 1400 }] },
  { id: 's2-dont-send', on: 'typing:unknown', requires: ['ch3'], actions: [{ t: 'wait', ms: 900 }, { t: 'msg', th: 'unknown', text: '지우겠다는 말이면, 보내지 마요.', typing: 800 }] },
  { id: 's2-ready-ch4', on: 'app:messages', requires: ['ch4'], actions: [{ t: 'msg', th: 'mom', text: '소연아 열었니' }] },
  { id: 's2-old-photo', on: 'photo:s2-old', actions: [{ t: 'flag', f: 'saw-old' }] },
];
