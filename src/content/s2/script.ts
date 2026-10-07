import type { Beat } from '../../engine/types';

// ─────────────────────────────────────────────────────────────────────────
// 「12%」 시즌 2 — 귀가. The story as beats (same engine as season 1).
// The 'dohyun' thread is 채원 this season; 'mom' is 엄마 (서미령); 'self' is
// 소연's 나에게. {s1name} / {typed1}: what the phone remembers of your season 1.
//
//   0 잠금      23:51  소연's phone, the door that won't close → 0314
//   1 엄마      23:52  the letter, the notebook album
//   2 노트      00:40  the recording of 엄마 at 01:58 → your name
//   3 관리자    01:12  소연's voice at the gate, 엄마's 1994 cassette, the admin app → 0928, the copy, the first sentence
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
      // nothing said: just six missed calls from 엄마, before you ever picked the phone up
      { t: 'calllog', entry: { who: '엄마', time: '23:48', kind: 'missed', count: 6 } },
      {
        t: 'objective',
        text: '소연의 폰 잠금을 풀자',
        hint: '채원의 문자: “어머니 사라지신 날”. 잠금 화면의 해원일보 알림에 그 날짜가 있어요. 월과 일, 네 자리로.',
      },
    ],
  },
  { id: 's2-hello', on: 'start', requires: ['s1-name'], actions: [{ t: 'wait', ms: 2600 }, { t: 'msg', th: 'unknown', text: '1년 만이네요.', typing: 1200 }] },
  { id: 's2-hello-new', on: 'start', forbids: ['s1-name'], actions: [{ t: 'wait', ms: 2600 }, { t: 'msg', th: 'unknown', text: '선반이 1년 비어 있었어요.', typing: 1400 }] },
  { id: 's2-lock-idle', on: 'lock:idle', forbids: ['unlocked'], actions: [{ t: 'msg', th: 'mom', text: '소연아 왜 대답이 없니' }] },
  { id: 's2-lock-idle2', on: 'lock:idle2', forbids: ['unlocked'], actions: [{ t: 'msg', th: 'unknown', text: '이번엔 문 안 닫았어요. 그래도 안 나가죠.' }] },
  { id: 's2-lock-fail3', on: 'lock:fail3', forbids: ['unlocked'], actions: [{ t: 'msg', th: CHAEWON, text: '0314요 언니 어머니 사라지신 날. 제발 열어 주세요' }] },

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
        nudge: { th: CHAEWON, text: '혹시 폰 여셨어요? 언니는 뭐든 메모에 적어 두는 사람이에요' },
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
    actions: [{ t: 'wait', ms: 30000 }, { t: 'msg', th: 'unknown', text: '{s1name} 씨. 작년에도 이 시간이었죠.', typing: 1500 }],
  },
  {
    id: 's2-remembers-typed',
    on: 'note:s2n1',
    requires: ['s1-typed'],
    actions: [{ t: 'wait', ms: 14000 }, { t: 'msg', th: 'unknown', text: '작년에 보낸 거 아직 있어요.', typing: 1200 }, { t: 'msg', th: 'unknown', text: '“{typed1}”', typing: 800 }],
  },
  {
    id: 's2-c1',
    on: 'thread:unknown',
    requires: ['unlocked'],
    forbids: ['ch2'],
    actions: [
      { t: 'wait', ms: 900 },
      { t: 'msg', th: 'unknown', text: '그 폰, 왜 주웠어요?', typing: 1800 },
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
      { t: 'msg', th: 'unknown', text: '다들 그거부터 물어요.', typing: 1400 },
      { t: 'emit', ev: 's2c1:done' },
    ],
  },
  {
    id: 's2-c1-done',
    on: 's2c1:done',
    actions: [
      { t: 'wait', ms: 1200 },
      { t: 'msg', th: 'unknown', text: '쓰던 사람은 집에 갔어요.', typing: 1300 },
      { t: 'msg', th: 'unknown', text: '요즘은 그 손 빌려 써요.', typing: 1300 },
    ],
  },
  {
    id: 's2-c1-find',
    on: 'choice:s2c1:find',
    actions: [{ t: 'msg', th: 'unknown', text: '어디 있는지 알잖아요.', typing: 1000 }, { t: 'msg', th: 'unknown', text: '두 시에 거기 있을 거예요.', typing: 1200 }, { t: 'emit', ev: 's2c1:done' }],
  },
  { id: 's2-c1-silent', on: 'choice:s2c1:silent', actions: [{ t: 'wait', ms: 2400 }, { t: 'msg', th: 'unknown', text: '읽기만 하네요.', typing: 800 }, { t: 'emit', ev: 's2c1:done' }] },
  {
    id: 's2-letter',
    on: 'note:s2n1',
    actions: [
      { t: 'flag', f: 'read-letter' },
      { t: 'wait', ms: 2600 },
      { t: 'msg', th: 'unknown', text: '뒤는 안 읽는 게 나아요.', typing: 1300 },
      {
        t: 'objective',
        app: 'gallery',
        text: '소연이 찍어 둔 노트를 보자',
        hint: '사진 앱 → “노트” 앨범. 마지막 장까지 넘기세요.',
        nudge: { th: 'unknown', text: '마지막 장, 넘기지 말고 봐요. 아직 쓰는 중이에요.' },
      },
    ],
  },
  {
    // Look at tonight's page long enough and, while you look, there is one more line.
    id: 's2-n3-more',
    on: 'photo:s2-n3:dwell',
    actions: [
      { t: 'wait', ms: 1200 },
      { t: 'flag', f: 's2-n3-more' },
      { t: 'sound', id: 'key', caption: '종이를 긁는 소리가 감지되었습니다.' },
      { t: 'vibrate', ms: [30] },
      { t: 'wait', ms: 4600 },
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
      { t: 'msg', th: CHAEWON, text: '언니 클라우드에 녹음 하나 방금 올라왔어요', typing: 1300, attach: { kind: 'memo', id: 's2m1' } },
      { t: 'msg', th: CHAEWON, text: '언니가 어머니 몰래 녹음한 거', typing: 900 },
      {
        t: 'objective',
        app: 'memos',
        text: '소연이 녹음한 엄마의 목소리를 듣자',
        hint: '녹음 앱 → “8월 28일 01:58”. 소리를 켜면 좋고, 꺼져 있어도 자막이 나옵니다.',
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
      { t: 'msg', th: CHAEWON, text: '도현이 이름이에요', typing: 800 },
      { t: 'msg', th: CHAEWON, text: '어머니가 쓰신 거', typing: 800 },
      { t: 'msg', th: CHAEWON, text: '오늘 누가 적히면 도현이 나와요', typing: 1300 },
      { t: 'msg', th: CHAEWON, text: '근데 그게 언니면', typing: 700 },
      { t: 'wait', ms: 1600 },
      { t: 'msg', th: 'unknown', text: '그쪽은요?', typing: 1200 },
      { t: 'emit', ev: 's2:ask-name' },
    ],
  },
  {
    id: 's2-ask-name-again',
    on: 's2:ask-name',
    requires: ['s1-name'],
    actions: [
      { t: 'msg', th: 'unknown', text: '작년엔 {s1name}.', typing: 1000 },
      { t: 'msg', th: 'unknown', text: '올해도 그 이름이에요?', typing: 1000 },
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
      { t: 'msg', th: 'unknown', text: '이름이 뭐예요?', typing: 1800 },
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
  { id: 's2-c2-same', on: 'choice:s2c2:same', actions: [{ t: 'flag', f: 'gave-name' }, { t: 'msg', th: 'unknown', text: '{name}. 작년 거 옆에 적어 둘게요.', typing: 2200 }, { t: 'emit', ev: 's2c2:done' }] },
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
      { t: 'notify', app: 'index', title: '보관소 관리', body: '관리자 한소연 · 다시 로그인하세요' },
      { t: 'wait', ms: 1800 },
      { t: 'msg', th: 'unknown', text: '소연 씨가 왜 폰을 두고 갔을까요.', typing: 1300 },
      { t: 'msg', th: 'unknown', text: '자기 손으로는 못 하는 게 있어서요.', typing: 1100 },
      { t: 'wait', ms: 2400 },
      { t: 'memo', id: 's2m2' },
      { t: 'msg', th: 'unknown', text: '부스 앞에서 녹음한 거예요. 안 지웠더라고요.', typing: 1500, attach: { kind: 'memo', id: 's2m2' } },
      // the admin password: if it stalls, 엄마 remembers the day she came home
      { t: 'emit', ev: 's2:pw-wait' },
      {
        t: 'objective',
        app: 'index',
        text: '보관소 관리 앱에 들어가자',
        hint: '비번은 메모 “보관소”와 나에게의 “엄마 돌아온 날”. 홈 화면 달력에 그 날짜가 있어요. 월과 일, 네 자리로.',
        nudge: { th: CHAEWON, text: '언니 비번은 다 어머니 날짜예요. 사라지신 날 아니면 돌아오신 날' },
      },
      // The night doesn't wait for the password (but leaves time for two recordings).
      // A minute in, past one in the morning, 엄마 — who should be asleep — starts typing. And sends nothing.
      { t: 'wait', ms: 60000 },
      { t: 'typing', th: 'mom', ms: 4200 },
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
      { t: 'msg', th: 'unknown', text: '명단 봤어요?', typing: 1000 },
      { t: 'wait', ms: 3200 },
      { t: 'msg', th: 'unknown', text: '사본을 지우면 어머니도 지워져요.', typing: 1600 },
      { t: 'msg', th: 'unknown', text: '소연 씨가 그 얘긴 안 했죠?', typing: 2600 },
      { t: 'wait', ms: 6000 },
      { t: 'flag', f: 'soyeon-contact' },
      { t: 'msg', th: 'self', from: 'me', text: '누구 있어요? 부스에 제 폰 불빛이 보여요', typing: 1600 },
      {
        t: 'objective',
        app: 'index',
        text: '02:00 전에 정하자 — 사본을 지울지',
        hint: '보관소 관리 → 기록 013 (사본) → 삭제. 이 기록에 처음 남은 문장은 실종 신고서(기록 003)의 신고자, 열한 살 소연의 말입니다. 지우지 않아도 02:00은 옵니다.',
      },
      { t: 'wait', ms: 75000 },
      { t: 'emit', ev: 'ch4' },
    ],
  },
  {
    id: 's2-armed',
    on: 'admin:armed',
    actions: [
      { t: 'flag', f: 'copy-armed' },
      { t: 'wait', ms: 1400 },
      { t: 'msg', th: 'unknown', text: '…지우는 건 그쪽 손이에요. 어머니 손 말고.', typing: 1600 },
      { t: 'msg', th: 'unknown', text: '어머니 얼굴 보고도 지울 수 있겠어요?', typing: 1600 },
    ],
  },
  // 엄마 has been reading the site. She knows what deleting it means — and says so,
  // but only once she has found it (01:51), whichever comes first.
  {
    id: 's2-mom-knows',
    on: 'admin:armed',
    requires: ['mom-site'],
    forbids: ['mom-knew'],
    actions: [
      // claimed at once, so arming the deletion meanwhile can't bring the other set of texts too
      { t: 'flag', f: 'mom-knew' },
      { t: 'wait', ms: 6000 },
      // slow thumbs: the typing indicator is her acting
      { t: 'msg', th: 'mom', text: '소연아 엄마 다 봤다', typing: 3200 },
      { t: 'msg', th: 'mom', text: '지워도 된다', typing: 2200 },
      { t: 'msg', th: 'mom', text: '엄마 너랑 일년 살았다', typing: 3000 },
      { t: 'msg', th: 'mom', text: '그럼 됐다', typing: 1600 },
    ],
  },
  {
    id: 's2-mom-knows-late',
    on: 's2:mom-site',
    requires: ['copy-armed'],
    forbids: ['mom-knew'],
    actions: [
      // claimed at once, so arming the deletion meanwhile can't bring the other set of texts too
      { t: 'flag', f: 'mom-knew' },
      { t: 'wait', ms: 5000 },
      // slow thumbs: the typing indicator is her acting
      { t: 'msg', th: 'mom', text: '소연아 엄마 다 봤다', typing: 3200 },
      { t: 'msg', th: 'mom', text: '지워도 된다', typing: 2200 },
      { t: 'msg', th: 'mom', text: '엄마 너랑 일년 살았다', typing: 3000 },
      { t: 'msg', th: 'mom', text: '그럼 됐다', typing: 1600 },
    ],
  },
  // …and to those who haven't: she found the site, so she knows what it costs. Her hand told her.
  {
    id: 's2-mom-asks',
    on: 's2:mom-site',
    forbids: ['copy-armed', 'mom-knew'],
    actions: [
      // claimed at once, so arming the deletion meanwhile can't bring the other set of texts too
      { t: 'flag', f: 'mom-knew' },
      { t: 'wait', ms: 5000 },
      { t: 'msg', th: 'mom', text: '소연아 엄마 다 봤다', typing: 3200 },
      { t: 'msg', th: 'mom', text: '그거 지우면 엄마도 가는 거지', typing: 2800 },
      { t: 'msg', th: 'mom', text: '손이 그렇게 말한다', typing: 2200 },
      { t: 'msg', th: 'mom', text: '괜찮다 엄마 너랑 일년 살았다', typing: 3000 },
    ],
  },
  // 소연 at the gate → the cassette she never played to the end opens
  // 엄마's hint for the admin password, ninety seconds in, if it's still locked
  {
    id: 's2-pw-hint',
    on: 's2:pw-wait',
    actions: [{ t: 'wait', ms: 90000 }, { t: 'emit', ev: 's2:pw-hint' }],
  },
  {
    id: 's2-pw-hint-mom',
    on: 's2:pw-hint',
    forbids: ['admin'],
    actions: [
      { t: 'msg', th: 'mom', text: '작년 오늘 새벽에 엄마 집에 왔지', typing: 2800 },
      { t: 'msg', th: 'mom', text: '니가 현관에서 한참 울었다', typing: 2400 },
    ],
  },
  {
    id: 's2-memo2-end',
    on: 'memo:s2m2:end',
    actions: [
      { t: 'wait', ms: 1600 },
      { t: 'msg', th: 'unknown', text: '끝까지 말 못 하죠. 어머니랑 똑같아요.', typing: 1600 },
      { t: 'wait', ms: 1800 },
      { t: 'flag', f: 'tape-ok' },
      { t: 'notify', app: 'memos', title: '녹음', body: '“엄마 목소리” — 이제 재생할 수 있습니다.' },
      { t: 'msg', th: 'unknown', text: '소연 씨는 그 테이프 늘 중간에 껐어요.', typing: 1600, attach: { kind: 'memo', id: 's2tape' } },
    ],
  },
  {
    id: 's2-tape-end',
    on: 'memo:s2tape:end',
    // silence first; then not a hint, a taunt
    actions: [{ t: 'wait', ms: 8000 }, { t: 'msg', th: 'unknown', text: '그 약속, 지켰다고 생각해요? 31년 늦게.', typing: 2000 }],
  },
  {
    id: 's2-wrong',
    on: 'admin:wrong',
    actions: [
      { t: 'wait', ms: 1400 },
      { t: 'msg', th: CHAEWON, text: '갑자기 생각났는데', typing: 700 },
      { t: 'msg', th: CHAEWON, text: '언니가 전에 그랬어요 경찰서에서 자기가 한 말이 아직 서류에 그대로 있다고', typing: 1900 },
    ],
  },

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
      { t: 'msg', th: CHAEWON, text: '저 학교 앞이에요', typing: 600 },
      { t: 'msg', th: CHAEWON, text: '도현이 나오나 보려고', typing: 800 },
      { t: 'msg', th: CHAEWON, text: '작년엔 도현이가 여기서 저 기다렸대요', typing: 1100 },
      { t: 'msg', th: CHAEWON, text: '입구까지만 온다더니 아침까지 있었대요', typing: 1200 },
      { t: 'wait', ms: 2000 },
      { t: 'msg', th: CHAEWON, text: '저 오면서 누구든 적히라고 빌었어요', typing: 1400 },
      { t: 'wait', ms: 2600 },
      { t: 'unsend', th: CHAEWON, match: '저 오면서 누구든' },
      { t: 'wait', ms: 7000 },
      { t: 'time', hm: '01:51' },
      { t: 'msg', th: 'mom', text: '소연아 엄마 지금 인터넷 보고 있다', typing: 2600 },
      { t: 'msg', th: 'mom', text: '엄마 얘기가 왜 거기있니', typing: 1600 },
      { t: 'wait', ms: 3000 },
      { t: 'msg', th: 'mom', text: '니가 만들었니', typing: 1200 },
      { t: 'msg', th: 'mom', text: '2004년이면 니 스물한살인데', typing: 1600 },
      { t: 'msg', th: 'mom', text: '혼자서', typing: 800 },
      { t: 'flag', f: 'mom-site' },
      { t: 'emit', ev: 's2:mom-site' },
      { t: 'wait', ms: 8000 },
      { t: 'time', hm: '01:52' },
      // the phone filmed it by itself: the notice says so, the clip says the rest
      { t: 'photo', id: 's2-kitchen2' },
      { t: 'notify', app: 'gallery', title: '사진', body: '동영상 1개 · 이 기기에서 촬영됨' },
      { t: 'wait', ms: 3000 },
      { t: 'msg', th: 'unknown', text: '방금 찍혔어요.', typing: 900, attach: { kind: 'photo', id: 's2-kitchen2' } },
      // season 1: "거기 앉아 있던 건 제가 아니에요." — this is who was sitting there
      { t: 'wait', ms: 1500 },
      { t: 'msg', th: 'unknown', text: '작년까진 열람실 의자에 앉아 있었어요.', typing: 1500 },
      { t: 'msg', th: 'unknown', text: '요즘은 식탁 의자예요.', typing: 1000 },
      { t: 'msg', th: 'unknown', text: '소연 씨가 들고 간 노트, 식탁에 와 있어요.', typing: 1400 },
      { t: 'wait', ms: 3500 },
      { t: 'time', hm: '01:53' },
      { t: 'call', id: 'eomma' },
      { t: 'wait', ms: 24000 },
      { t: 'time', hm: '01:55' },
      { t: 'battery', v: 4 },
      { t: 'notify', app: 'notes', title: '메모', body: '새 메모: 9월 28일' },
      { t: 'write', text: '02:00 — 한', ms: 480 },
      { t: 'msg', th: 'unknown', text: '어머니 글씨 예쁘죠.', typing: 1200 },
      { t: 'msg', th: 'unknown', text: '그 메모에 그쪽이 써도, 식탁 노트에 써져요.', typing: 1600 },
      { t: 'wait', ms: 8000 },
      { t: 'time', hm: '01:56' },
      { t: 'msg', th: CHAEWON, text: '부스 앞이에요 문 열려 있네요', typing: 900 },
      { t: 'msg', th: CHAEWON, text: '근데 그쪽 안 보여요', typing: 700 },
      { t: 'msg', th: CHAEWON, text: '선반에 폰 불빛만 있어요', typing: 1000 },
      { t: 'wait', ms: 4000 },
      { t: 'time', hm: '01:57' },
      // Inside, phones only reach 나에게 (채원 learned that last year).
      { t: 'flag', f: 'soyeon-contact' },
      // (whether or not she reached you at 01:13 — this works either way)
      { t: 'msg', th: 'self', from: 'me', text: '아직 거기 있죠? 제 폰', typing: 1200 },
      { t: 'msg', th: 'self', from: 'me', text: '도현 씨 폰으로 보내요', typing: 900 },
      { t: 'msg', th: 'self', from: 'me', text: '배터리가 12%에서 안 내려가요', typing: 1100 },
      { t: 'msg', th: 'self', from: 'me', text: '도현 씨 제 옆에서 자요. 안 깨요', typing: 1300 },
      { t: 'msg', th: 'self', from: 'me', text: '지웠어요?', typing: 900 },
      {
        t: 'choice',
        th: 'self',
        id: 's2c5',
        options: [
          { id: 'erase', label: '지울 거예요.' },
          { id: 'ask', label: '정말 남으실 거예요?' },
        ],
      },
      { t: 'wait', ms: 13000 },
      { t: 'unchoice', id: 's2c5' },
      { t: 'time', hm: '01:58' },
      { t: 'battery', v: 3 },
      // for a moment her pen writes your name instead — then scratches it out.
      // Most players are in Messages talking to 소연: call them over first, and let the letter stay long enough to read.
      { t: 'notify', app: 'notes', title: '메모', body: '“9월 28일” · 지금 수정 중' },
      { t: 'wait', ms: 3000 },
      { t: 'write', text: '\b{initial}', ms: 1400 },
      { t: 'vibrate', ms: [40, 30, 40] },
      { t: 'wait', ms: 2600 },
      { t: 'write', text: '\b한소', ms: 900 },
      { t: 'msg', th: 'unknown', text: '소연 씨 이름은 짧아서 좋아요.', typing: 1200 },
      { t: 'wait', ms: 5000 },
      { t: 'time', hm: '01:59' },
      { t: 'hush', ms: 3000, still: true },
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
      { t: 'msg', th: 'self', from: 'me', text: '엄마한테는 제가 말할게요', typing: 1200 },
      { t: 'msg', th: 'self', from: 'me', text: '아니 못 하겠다', typing: 800 },
    ],
  },
  {
    id: 's2-c5-ask',
    on: 'choice:s2c5:ask',
    actions: [
      { t: 'flag', f: 'asked-her' },
      { t: 'msg', th: 'self', from: 'me', text: '엄마 여기 31년 있었어요 혼자', typing: 1400 },
      { t: 'msg', th: 'self', from: 'me', text: '저는 엄마 딸이잖아요', typing: 1000 },
      { t: 'msg', th: 'self', from: 'me', text: '…근데 무서워요', typing: 1200 },
    ],
  },

  // ── between the big moments ───────────────────────────────────────────
  { id: 's2-chaewon-blocked', on: 'dohyun:blocked', forbids: ['s2-chaewon-blocked'], actions: [{ t: 'flag', f: 's2-chaewon-blocked' }, { t: 'wait', ms: 1600 }, { t: 'msg', th: 'unknown', text: '채원 씨한텐 안 가요. 오늘은 저랑만 얘기해요.', typing: 1500 }] },
  { id: 's2-mom-blocked', on: 'mom:blocked', forbids: ['s2-mom-blocked'], actions: [{ t: 'flag', f: 's2-mom-blocked' }, { t: 'wait', ms: 1600 }, { t: 'msg', th: 'unknown', text: '어머니께는 안 가요. 어머니는 지금 손이 바쁘세요.', typing: 1400 }] },
  { id: 's2-power', on: 'power:try', requires: ['unlocked'], repeat: true, actions: [{ t: 'wait', ms: 900 }, { t: 'msg', th: 'unknown', text: '끄세요. 그게 제일 편해요.', typing: 1200 }] },
  {
    id: 's2-sees-gallery',
    on: 'app:gallery',
    requires: ['read-letter'],
    forbids: ['ch2'],
    actions: [{ t: 'wait', ms: 5000 }, { t: 'typing', th: 'unknown', ms: 2400 }, { t: 'wait', ms: 3000 }, { t: 'msg', th: 'unknown', text: '94년 사진 봤어요? 그땐 딸보다 서른 살 많았어요. 지금은 두 살 어리고요.' }] },
  { id: 's2-sees-index', on: 'app:index', requires: ['admin', 'mom-site'], actions: [{ t: 'wait', ms: 6000 }, { t: 'msg', th: 'unknown', text: '보는 사람 하나 늘었죠. 어머니예요.', typing: 1400 }] },
  { id: 's2-dont-send', on: 'typing:unknown', requires: ['ch3'], actions: [{ t: 'wait', ms: 900 }, { t: 'msg', th: 'unknown', text: '지운다는 얘기면 보내지 마요.', typing: 800 }] },
  { id: 's2-ready-ch4', on: 'app:messages', requires: ['ch4'], actions: [{ t: 'msg', th: 'mom', text: '소연아 거기 춥니' }] },
  { id: 's2-old-photo', on: 'photo:s2-old', actions: [{ t: 'flag', f: 'saw-old' }] },
  { id: 's2-kitchen2-seen', on: 'photo:s2-kitchen2', actions: [{ t: 'wait', ms: 2400 }, { t: 'msg', th: 'unknown', text: '8월 거보다 가깝죠.', typing: 1000 }] },
];
