import type { Beat } from '../engine/types';

// ─────────────────────────────────────────────────────────────────────────
// 새벽 2시의 휴대폰 — the story, as beats.
// Each beat fires once when its event happens (and its flags allow it).
// {name} is replaced with the player's name (or 방문자님) at delivery time.
//
// Chapter map (in-game clock):
//   0 잠금        23:51  unlock the phone
//   1 채원의 폰    23:52  the unknown number talks to you → the black photo
//   2 목소리      00:47  도현 calls → the last voice memo → "what's your name?"
//   3 제2서고     01:12  hidden album → the selfie → 채원 texts from inside
//   4 두 시 전    01:50  the key, a new app, the phone stops obeying
//   5 02:00             finale (phone/Finale.tsx) and three endings
// ─────────────────────────────────────────────────────────────────────────

export const BEATS: Beat[] = [
  // ── 0. 잠금 ────────────────────────────────────────────────────────────
  {
    id: 'start',
    on: 'start',
    actions: [
      { t: 'time', hm: '23:51' },
      { t: 'battery', v: 12 },
      { t: 'objective', text: '폰의 잠금을 풀자', hint: '잠금 화면의 도현 메시지: 비번은 “처음 만난 날”이고, 채원은 그 숫자 시각에 일부러 들어갔다. 그럼 카메라 알림의 시각이 곧 그 날짜. 네 자리로.' },
      { t: 'wait', ms: 2000 },
      { t: 'call', id: 'door' },
    ],
  },
  // However the call went, the riddle is also left in writing.
  { id: 'door-end', on: 'call:door:end', actions: [{ t: 'emit', ev: 'door:done' }] },
  { id: 'door-hangup', on: 'call:door:hangup', actions: [{ t: 'emit', ev: 'door:done' }] },
  {
    id: 'door-decline',
    on: 'call:door:decline',
    actions: [{ t: 'wait', ms: 700 }, { t: 'msg', th: 'unknown', text: '받지 그랬어요.', typing: 600 }, { t: 'emit', ev: 'door:done' }],
  },
  {
    id: 'door-riddle',
    on: 'door:done',
    forbids: ['unlocked'],
    actions: [{ t: 'wait', ms: 900 }, { t: 'msg', th: 'unknown', text: '문은 열어 뒀어요. 도현 씨 말, 날짜인 줄 알죠? 시각이에요.', typing: 1200 }],
  },
  {
    id: 'lock-idle',
    on: 'lock:idle',
    forbids: ['unlocked'],
    actions: [{ t: 'msg', th: 'unknown', text: '들어오세요.' }],
  },
  {
    id: 'lock-fail3',
    on: 'lock:fail3',
    forbids: ['unlocked'],
    actions: [{ t: 'msg', th: 'dohyun', text: '채원이 들어간 건 1시 13분이에요. 영상 켜고 들어갔어요.' }],
  },

  // ── 1. 채원의 폰 ───────────────────────────────────────────────────────
  {
    id: 'unlock',
    on: 'unlock',
    actions: [
      { t: 'flag', f: 'unlocked' },
      { t: 'time', hm: '23:52' },
      { t: 'chapter', n: 1, title: '채원의 폰' },
      {
        t: 'objective', app: 'messages',
        text: '채원에게 무슨 일이 있었는지 알아내자',
        hint: '메시지 앱을 열어 보세요. “발신자 정보 없음” 대화가 하나 있습니다.',
        nudge: { th: 'dohyun', text: '혹시 폰 열었어요? 발신자 정보 없음으로 온 메시지 있으면… 절대 답하지 마요' },
      },
      { t: 'wait', ms: 1800 },
      // 채원 walked in at 01:13 on purpose: her passcode, the day she met 도현 (her script note says so). (One message: nothing can land between.)
      { t: 'msg', th: 'unknown', text: '들어왔네요. 1월 13일, 1시 13분. 채원 씨도 그 숫자로 들어왔어요.', typing: 1800 },
    ],
  },
  {
    id: 'unknown-1',
    on: 'thread:unknown',
    requires: ['unlocked'],
    // Went straight to the photo and brightened it? Then this first exchange is already past.
    forbids: ['reveal-scare'],
    actions: [
      { t: 'wait', ms: 1000 },
      { t: 'msg', th: 'unknown', text: '그 폰, 주운 거죠?', typing: 2200 },
      {
        t: 'choice',
        th: 'unknown',
        id: 'c1',
        options: [
          { id: 'who', label: '누구세요?' },
          { id: 'yes', label: '네. 주웠어요.' },
          { id: 'silent', label: '(대답하지 않는다)', reply: '' },
        ],
      },
    ],
  },
  {
    id: 'c1-who',
    on: 'choice:c1:who',
    actions: [
      { t: 'msg', th: 'unknown', text: '새벽 두 시에 여기 있는 사람 이름을 적어 두는 사람이에요.', typing: 2000 },
      { t: 'msg', th: 'unknown', text: '채원 씨 이름도 제가 적었어요. 오늘 밤엔 당신 이름을 적을 거고요.', typing: 2400 },
      { t: 'emit', ev: 'c1:done' },
    ],
  },
  {
    id: 'c1-yes',
    on: 'choice:c1:yes',
    actions: [
      { t: 'msg', th: 'unknown', text: '고마워요. 그 폰은 원래 여기 있어야 하거든요.', typing: 2400 },
      { t: 'emit', ev: 'c1:done' },
    ],
  },
  {
    id: 'c1-silent',
    on: 'choice:c1:silent',
    actions: [
      { t: 'wait', ms: 2600 },
      { t: 'msg', th: 'unknown', text: '읽은 거 다 보여요.', typing: 700 },
      { t: 'emit', ev: 'c1:done' },
    ],
  },
  {
    id: 'c1-done',
    on: 'c1:done',
    forbids: ['reveal-scare'],
    actions: [
      { t: 'msg', th: 'unknown', text: '채원 씨 마지막 사진, 봤어요?', typing: 2000 },
      { t: 'msg', th: 'unknown', text: '이거요.', typing: 900, attach: { kind: 'photo', id: 'p07' } },
      { t: 'flag', f: 'asked-photo' },
      {
        t: 'objective', app: 'gallery',
        text: '채원이 마지막으로 찍은 사진을 확인하자',
        hint: '사진 앱 → 최근 항목의 맨 마지막 사진(01:59).',
        nudge: { th: 'unknown', text: '사진 앱. 맨 마지막 거요.' },
      },
    ],
  },
  {
    id: 'p07-seen',
    on: 'photo:p07',
    requires: ['unlocked'],
    actions: [
      { t: 'wait', ms: 1500 },
      { t: 'msg', th: 'unknown', text: '…너무 밝게 보지는 마요.', typing: 1300 },
      {
        t: 'objective', app: 'gallery',
        text: '마지막 사진에 뭔가 찍혀 있다',
        hint: '사진을 연 채로 아래의 [편집]을 누르고, 밝기를 끝까지 올려 보세요.',
        nudge: { th: 'unknown', text: '편집 버튼, 누르지 마요.' },
      },
    ],
  },
  {
    id: 'reveal',
    on: 'photo:p07:reveal',
    actions: [
      { t: 'flag', f: 'reveal-scare' },
      // Fully bright, and the room is empty. Nothing changes, no warning.
      { t: 'wait', ms: 1200 },
      // Behind the scare, the photo changes: when it fades, she was there all along.
      { t: 'flag', f: 'p07-revealed' },
      { t: 'scare', kind: 'lunge', look: 'hang' },
      { t: 'wait', ms: 1700 },
      { t: 'glitch', ms: 1000 },
      { t: 'time', hm: '00:31', lost: true },
      { t: 'calllog', entry: { who: '0200', time: '23:53', kind: 'out', duration: '38:12' } },
      { t: 'wait', ms: 1600 },
      { t: 'msg', th: 'unknown', text: '봤죠?', typing: 500 },
      { t: 'objective', app: 'phone', text: '…시간이 30분 넘게 사라졌다', hint: '곧 도현에게서 전화가 옵니다. 받으세요. 전화가 끊겼거나 놓쳤다면 전화 앱 → 최근 기록에서 도현을 눌러 다시 걸 수 있어요.' },
      { t: 'wait', ms: 3500 },
      { t: 'call', id: 'dohyun1' },
    ],
  },

  // ── 2. 목소리 ──────────────────────────────────────────────────────────
  {
    id: 'call1-decline',
    on: 'call:dohyun1:decline',
    forbids: ['call1-done'],
    actions: [
      { t: 'flag', f: 'declined-once' },
      { t: 'msg', th: 'dohyun', text: '받아 주세요. 제발.', typing: 700 },
      { t: 'wait', ms: 9000 },
      { t: 'call', id: 'dohyun1' },
    ],
  },
  {
    id: 'call1-decline2',
    on: 'call:dohyun1:decline',
    requires: ['declined-once'],
    forbids: ['call1-done'],
    actions: [
      { t: 'msg', th: 'dohyun', text: '알았어요. 그럼 이것만.', typing: 1000 },
      { t: 'msg', th: 'dohyun', text: '채원이 녹음 앱 켜 놓고 들어갔어요. 마지막 녹음 들어 보세요.', typing: 2200 },
      { t: 'msg', th: 'dohyun', text: '그리고 두 시 전에 그 폰 꺼요.', typing: 1400 },
      { t: 'emit', ev: 'call1:done' },
    ],
  },
  { id: 'call1-end', on: 'call:dohyun1:end', actions: [{ t: 'emit', ev: 'call1:done' }] },
  // Missing the call also counts as a decline for the flow above; remember it was only missed.
  { id: 'call1-missed', on: 'call:dohyun1:missed', actions: [{ t: 'flag', f: 'missed-dohyun' }] },
  // Hung up (or the line dropped) before he finished: he calls back once, then texts.
  {
    id: 'call1-hangup',
    on: 'call:dohyun1:hangup',
    forbids: ['call1-done', 'hung-once'],
    actions: [
      { t: 'flag', f: 'hung-once' },
      { t: 'msg', th: 'dohyun', text: '끊겼어요? 신호가 안 좋은가 봐요. 다시 걸게요.', typing: 900 },
      { t: 'wait', ms: 6000 },
      { t: 'call', id: 'dohyun1' },
    ],
  },
  {
    id: 'call1-hangup2',
    on: 'call:dohyun1:hangup',
    requires: ['hung-once'],
    forbids: ['call1-done'],
    actions: [
      { t: 'msg', th: 'dohyun', text: '계속 끊기네요. 문자로 할게요.', typing: 1000 },
      { t: 'msg', th: 'dohyun', text: '채원이 녹음 앱 켜 놓고 들어갔어요. 마지막 녹음 들어 보세요.', typing: 2200 },
      { t: 'msg', th: 'dohyun', text: '그리고 두 시 전에 그 폰 꺼요.', typing: 1400 },
      { t: 'emit', ev: 'call1:done' },
    ],
  },
  {
    id: 'call1-done',
    on: 'call1:done',
    actions: [
      { t: 'flag', f: 'call1-done' },
      { t: 'chapter', n: 2, title: '목소리' },
      { t: 'time', hm: '00:47' },
      { t: 'msg', th: 'dohyun', text: '채원이 마지막 녹음이에요. 꼭 끝까지 들어요.', typing: 1600, attach: { kind: 'memo', id: 'm1' } },
      { t: 'msg', th: 'dohyun', text: '그리고 저 지금 학교로 가요. 20분이면 가요.', typing: 1800 },
      { t: 'msg', th: 'unknown', text: '전화부스 문, 밀어 봐요. 두 시까지는 안 열려요.', typing: 1600 },
      {
        t: 'objective', app: 'memos',
        text: '채원의 마지막 녹음을 듣자',
        hint: '녹음 앱 → “새 녹음 17”. 소리를 켜고, 이어폰이 있다면 끼세요.',
        nudge: { th: 'dohyun', text: '녹음 들어 봤어요? 녹음 앱이요. 끝까지요' },
      },
    ],
  },
  // The camera recording that "failed to save": ten seconds of it come back. Found by looking at the
  // stairs photo it was taken with — or, at the latest, handed over when the hidden album is.
  {
    id: 'v01-stairs',
    on: 'photo:p03',
    requires: ['reveal-scare'],
    forbids: ['v01-given'],
    actions: [
      { t: 'flag', f: 'v01-given' },
      { t: 'wait', ms: 2200 },
      { t: 'photo', id: 'v01' },
      { t: 'notify', app: 'gallery', title: '사진', body: '손상된 동영상 1개를 복구했습니다.' },
      { t: 'msg', th: 'unknown', text: '그 계단, 영상도 있어요. 끝까지 봐요.', typing: 1400, attach: { kind: 'photo', id: 'v01' } },
    ],
  },
  {
    id: 'v01-late',
    on: 'c2:done',
    forbids: ['v01-given'],
    actions: [
      { t: 'flag', f: 'v01-given' },
      // after the chapter card and the hidden-album messages
      { t: 'wait', ms: 14000 },
      { t: 'photo', id: 'v01' },
      { t: 'msg', th: 'unknown', text: '채원 씨 영상, 전부 날아간 건 아니에요.', typing: 1600, attach: { kind: 'photo', id: 'v01' } },
    ],
  },
  {
    id: 'v01-end',
    on: 'video:v01:end',
    actions: [{ t: 'wait', ms: 1400 }, { t: 'msg', th: 'unknown', text: '계단 위에요. 채원 씨는 그날 끝까지 올라갔어요.', typing: 1800 }],
  },
  {
    id: 'memo-end',
    on: 'memo:m1:end',
    actions: [
      { t: 'flag', f: 'memo-done' },
      { t: 'wait', ms: 1800 },
      { t: 'msg', th: 'unknown', text: '이제 목소리도 알죠.', typing: 1500 },
      { t: 'msg', th: 'unknown', text: '앉으세요, 라고 했잖아요.', typing: 1600 },
      { t: 'msg', th: 'unknown', text: '당신 이름은 뭐예요?', typing: 1800 },
      {
        t: 'choice',
        th: 'unknown',
        id: 'c2',
        options: [
          { id: 'name', label: '이름을 알려 준다', input: 'name' },
          { id: 'no', label: '알려 주지 않는다', reply: '싫어요.' },
        ],
      },
      {
        t: 'objective', app: 'messages',
        text: '“발신자 정보 없음”이 이름을 묻는다',
        hint: '메시지 앱 → 발신자 정보 없음. 알려 줄지 말지는 당신 선택입니다. (이름은 이 기기에만 저장됩니다)',
        nudge: { th: 'unknown', text: '대답해요.' },
      },
    ],
  },
  {
    id: 'c2-name',
    on: 'choice:c2:name',
    actions: [
      { t: 'flag', f: 'gave-name' },
      { t: 'msg', th: 'unknown', text: '{name}.', typing: 1300 },
      { t: 'msg', th: 'unknown', text: '좋은 이름이네요. 적어 둘게요.', typing: 1900 },
      { t: 'msg', th: 'unknown', text: '선물 하나 줄게요. 숨김 앨범 비밀번호는… 채원 씨가 제일 무서워한 방송이에요.', typing: 2600 },
      { t: 'emit', ev: 'c2:done' },
    ],
  },
  {
    id: 'c2-no',
    on: 'choice:c2:no',
    actions: [
      { t: 'flag', f: 'refused-name' },
      { t: 'msg', th: 'unknown', text: '괜찮아요. 어차피 곧 알게 돼요.', typing: 1900 },
      { t: 'emit', ev: 'c2:done' },
    ],
  },
  {
    id: 'c2-done',
    on: 'c2:done',
    actions: [
      { t: 'flag', f: 'ch3' },
      { t: 'chapter', n: 3, title: '제2서고' },
      { t: 'time', hm: '01:12' },
      {
        t: 'objective', app: 'notes',
        text: '사진 앱의 숨김 앨범을 열자',
        hint: '메모 앱 “비번들 (보지 마)”에 힌트가 있습니다. 그 방송의 주파수는 메모 “괴담 정리”나 브라우저의 기록 001에 나와요.',
        nudge: { th: 'unknown', text: '숫자를 읽던 그 방송. 주파수요.' },
      },
      { t: 'msg', th: 'unknown', text: '채원 씨가 숨겨 둔 사진들이에요. 보고 싶죠?', typing: 1800, attach: { kind: 'album' } },
      // Found the code early? The album has finished syncing now.
      { t: 'emit', ev: 'album:recheck' },
      { t: 'wait', ms: 26000 },
      { t: 'msg', th: 'dohyun', text: '택시 기다리는 중이에요. 폰 끄라는 거, 제보 메일 끝에 있던 말이에요. 채원이가 캡처해서 보여 줬었어요', typing: 2400 },
      { t: 'msg', th: 'dohyun', text: '그때 가지 말라고 더 말렸어야 했는데', typing: 1600 },
    ],
  },

  // ── 3. 제2서고 ─────────────────────────────────────────────────────────
  {
    id: 'album-open',
    on: 'album:unlock',
    requires: ['ch3'],
    actions: [
      { t: 'flag', f: 'album-open' },
      { t: 'objective', app: 'gallery', text: '숨김 앨범을 끝까지 넘겨 보자', hint: '사진을 연 뒤 옆으로 넘기세요. 마지막 사진까지.', nudge: { th: 'unknown', text: '끝까지 넘겨요.' } },
    ],
  },
  {
    id: 'album-open-late',
    on: 'album:recheck',
    requires: ['ch3', 'album-code'],
    forbids: ['album-open'],
    actions: [
      { t: 'flag', f: 'album-open' },
      { t: 'wait', ms: 3500 },
      { t: 'notify', app: 'gallery', title: '사진', body: '숨김 앨범 동기화 완료 (5/5)' },
      { t: 'msg', th: 'unknown', text: '비밀번호는 벌써 알고 있었네요. 이제 사진도 다 왔어요.', typing: 1800, attach: { kind: 'album' } },
      { t: 'objective', app: 'gallery', text: '숨김 앨범을 끝까지 넘겨 보자', hint: '사진 앱 → 숨김. 사진을 연 뒤 옆으로 넘기세요. 마지막 사진까지.', nudge: { th: 'unknown', text: '끝까지 넘겨요.' } },
    ],
  },
  {
    id: 'card',
    on: 'photo:h03',
    requires: ['ch3'],
    actions: [
      { t: 'flag', f: 'saw-card' },
      { t: 'wait', ms: 1600 },
      { t: 'msg', th: 'unknown', text: '채원 씨 카드예요. 당신 것도 곧 만들어져요.', typing: 1700 },
    ],
  },
  {
    id: 'selfie',
    on: 'photo:h05:dwell',
    requires: ['ch3'],
    actions: [
      { t: 'flag', f: 'selfie-scare' },
      // Only 채원 in the photo, and nothing warns. Behind the scare the photo changes.
      { t: 'flag', f: 'h05-revealed' },
      { t: 'scare', kind: 'lunge', look: 'profile' },
      { t: 'wait', ms: 1800 },
      { t: 'glitch', ms: 700 },
      { t: 'time', hm: '01:38', lost: true },
      { t: 'calllog', entry: { who: '엄마', time: '01:37', kind: 'out', duration: '0:41' } },
      { t: 'wait', ms: 2600 },
      { t: 'msg', th: 'self', from: 'me', text: '여기 너무 추워' },
      { t: 'objective', app: 'messages', text: '누군가 이 폰으로 “나에게” 메시지를 보냈다', hint: '메시지 앱 → 나에게.', nudge: { th: 'self', from: 'me', text: '대답해 제발' } },
      { t: 'wait', ms: 22000 },
      { t: 'msg', th: 'mom', text: '채원아 방금 전화 너였니?', typing: 1200 },
      { t: 'msg', th: 'mom', text: '아무 말도 안 하고 숨소리만 들리더라', typing: 1600 },
      { t: 'msg', th: 'mom', text: '엄마 너무 무섭다. 제발 한마디만 해 줘', typing: 1800 },
      { t: 'wait', ms: 4000 },
      { t: 'msg', th: 'unknown', text: '어머니 목소리, 좋네요. 우리 애도 저렇게 기다렸을 거예요.', typing: 2200 },
    ],
  },
  {
    id: 'self-1',
    on: 'thread:self',
    requires: ['selfie-scare'],
    actions: [
      { t: 'wait', ms: 1200 },
      { t: 'msg', th: 'self', from: 'me', text: '누구야? 내 폰 들고 있는 사람', typing: 1600 },
      {
        t: 'choice',
        th: 'self',
        id: 'c3',
        options: [
          { id: 'chaewon', label: '채원 씨예요?' },
          { id: 'finder', label: '폰을 주운 사람이에요.' },
        ],
      },
    ],
  },
  {
    id: 'c3',
    on: 'choice:c3:*',
    actions: [
      { t: 'flag', f: 'self-contact' },
      { t: 'msg', th: 'self', from: 'me', text: '제발 도와줘. 여기 문이 없어. 서랍만 있어', typing: 2200 },
      { t: 'msg', th: 'self', from: 'me', text: '두 시에 다음 사람 이름이 적히면 나는 나갈 수 있대', typing: 2400 },
      { t: 'msg', th: 'self', from: 'me', text: '나도 그 전화부스에서 폰 주웠어. 박현우라는 사람 폰', typing: 2200 },
      { t: 'msg', th: 'self', from: 'me', text: '내 폰은 두 시 되자마자 손에서 없어졌어. 그 여자가 전화부스에 갖다 놔. 다음 사람 주우라고. 제보 메일도 그 여자였어', typing: 2800 },
      { t: 'msg', th: 'self', from: 'me', text: '그 폰 지금 여기 서랍 안에 있어. 12%. 전화도 112도 안 돼. 내 폰 ‘나에게’로만 가', typing: 2400 },
      { t: 'msg', th: 'self', from: 'me', text: '네가 들고 있는 거 내 폰이지? 그럼 다음은 너야', typing: 2000 },
      { t: 'msg', th: 'self', from: 'me', text: '기록보관소 사이트 013번. 그 여자가 무서워하는 게 거기 있어', typing: 2600, attach: { kind: 'archive' } },
      { t: 'msg', th: 'self', from: 'me', text: '라디오 숫자 순서대로 열어야 나와. 메모에 적어 놨어', typing: 2000 },
      { t: 'wait', ms: 1500 },
      { t: 'draft', th: 'self', text: '그 여자 지금 내 뒤에' },
      { t: 'time', hm: '01:44' },
      {
        t: 'objective', app: 'browser',
        text: '브라우저의 “심야 기록보관소”에서 기록 013을 찾자',
        hint: '메모 “괴담 정리”의 숫자 순서: 기록 001 → 003 → 007을 다른 기록을 섞지 않고 차례로 여세요.',
        nudge: { th: 'self', from: 'me', text: '001 003 007. 순서대로. 중간에 다른 거 열면 안 돼' },
      },
      { t: 'wait', ms: 15000 },
      { t: 'msg', th: 'unknown', text: '채원 씨랑 얘기하지 마세요.', typing: 1200 },
      { t: 'wait', ms: 7000 },
      { t: 'photo', id: 'p08' },
      { t: 'msg', th: 'unknown', text: '잘 나왔네요.', typing: 1600, attach: { kind: 'photo', id: 'p08' } },
      { t: 'msg', th: 'unknown', text: '두 번 눌러서 확대해 봐요. 전화부스 안이요.', typing: 1500 },
      { t: 'wait', ms: 6000 },
      { t: 'msg', th: 'dohyun', text: '택시가 안 잡혀서 늦었어요. 학교 앞 도착. 전화부스 쪽으로 갈게요.', typing: 1400 },
      { t: 'emit', ev: 'dohyun:late-text' },
      { t: 'wait', ms: 7000 },
      { t: 'sound', id: 'knock', caption: '유리를 두드리는 소리가 감지되었습니다.' },
      { t: 'wait', ms: 1800 },
      { t: 'msg', th: 'unknown', text: '방금 그거, 전화부스 유리 두드린 거예요. 도현 씨 아니에요.', typing: 1600 },
      { t: 'wait', ms: 6000 },
      { t: 'reboot', wallpaper: 'booth' },
      { t: 'msg', th: 'unknown', text: '배경화면 바꿔 놨어요. 마음에 들어요?' },
    ],
  },
  {
    id: 'read-miryeong',
    on: 'browser:r003',
    actions: [{ t: 'flag', f: 'read-miryeong' }],
  },
  {
    id: 'key',
    on: 'browser:r013',
    requires: ['self-contact'],
    actions: [{ t: 'flag', f: 'found-key' }, { t: 'wait', ms: 2500 }, { t: 'emit', ev: 'ch4' }],
  },

  // ── 4. 두 시 전 ────────────────────────────────────────────────────────
  {
    id: 'r013-early',
    on: 'browser:r013-early',
    actions: [{ t: 'wait', ms: 1500 }, { t: 'msg', th: 'unknown', text: '순서를 건너뛰면 안 돼요, {name}. 아직 그 기록을 쓸 시간이 아니에요.', typing: 2200 }],
  },
  {
    id: 'ch4',
    on: 'ch4',
    requires: ['found-key', 'self-contact'],
    actions: [
      { t: 'flag', f: 'ch4' },
      { t: 'glitch', ms: 900 },
      { t: 'chapter', n: 4, title: '두 시 전' },
      { t: 'time', hm: '01:50' },
      { t: 'battery', v: 6 },
      { t: 'shuffle' },
      { t: 'install', app: 'index' },
      { t: 'notify', app: 'index', title: '야간 출입 기록', body: '설치 완료 · 지금 도서관 안에 있는 사람' },
      { t: 'wait', ms: 2200 },
      { t: 'msg', th: 'unknown', text: '{name}, 그 코드를 찾았네요.', typing: 1400 },
      { t: 'msg', th: 'unknown', text: '그건 쓰면 안 돼요.', typing: 1200 },
      { t: 'msg', th: 'unknown', text: '…써요. 두 시에. 제 이름이랑 같이.', typing: 900 },
      { t: 'wait', ms: 4500 },
      { t: 'unsend', th: 'unknown', match: '…써요. 두 시에' },
      { t: 'wait', ms: 1200 },
      { t: 'msg', th: 'unknown', text: '새로 생긴 앱, 열어 봐요. 도서관 출입 기록이에요. 지금 안에 있는 사람들 이름.', typing: 2200 },
      { t: 'msg', th: 'unknown', text: '코드를 쓰면 기록이 전부 지워져요. 아무도 기록되지 않아요. 아무도 기억되지 않아요.', typing: 2600 },
      {
        t: 'objective', app: 'index',
        text: '02:00에 삭제 코드와 처음 갇힌 사람의 이름이 필요하다',
        hint: '02:00에 선택의 순간이 옵니다. 삭제 코드(HAEWON-0200, 기록 013)와 처음 갇힌 사람의 이름(기록 003)을 기억해 두세요. 02:00 화면에서도 읽은 기록을 다시 볼 수 있어요. 새로 생긴 녹음 18도 들어 보세요.',
      },
      { t: 'sound', id: 'heartbeat' },
      // One thing every in-game minute, until 02:00.
      { t: 'wait', ms: 9000 },
      { t: 'time', hm: '01:51' },
      { t: 'note', id: 'n4' },
      { t: 'memo', id: 'm2' },
      { t: 'notify', app: 'memos', title: '녹음', body: '새 녹음 18이 저장되었습니다.' },
      { t: 'msg', th: 'unknown', text: '녹음 하나 더 있어요. 이번엔 채원 씨 거 아니에요.', typing: 1800, attach: { kind: 'memo', id: 'm2' } },
      // time to actually listen to recording 18 before the last minutes pile up
      { t: 'wait', ms: 20000 },
      { t: 'time', hm: '01:52' },
      { t: 'msg', th: 'unknown', text: '이 폰 시계는 {clock}이지만, 당신 쪽은 {real}이죠?', typing: 2000 },
      { t: 'wait', ms: 12000 },
      { t: 'time', hm: '01:53' },
      { t: 'msg', th: 'dohyun', text: '전화부스 보여요. 당신도 보여요. 거기 계속 계세요', typing: 1200 },
      { t: 'wait', ms: 4000 },
      { t: 'photo', id: 'v02' },
      { t: 'msg', th: 'dohyun', text: '근데 당신 뒤에 서 있는 사람 누구예요?', typing: 1400, attach: { kind: 'photo', id: 'v02' } },
      { t: 'wait', ms: 6000 },
      { t: 'time', hm: '01:54' },
      { t: 'msg', th: 'dohyun', text: '뒤돌아보지 마요.', typing: 500 },
      { t: 'msg', th: 'unknown', text: '돌아봐도 돼요.', typing: 900 },
      { t: 'wait', ms: 10000 },
      { t: 'time', hm: '01:55' },
      { t: 'battery', v: 4 },
      { t: 'dialog', title: '배터리 부족', body: '배터리가 4% 남았습니다. 저전력 모드를 켤 수 없습니다: 야간 출입 기록이 사용 중.' },
      { t: 'msg', th: 'dohyun', text: '3층 창문에 채원이 있어요. 손 흔들어요', typing: 1200 },
      { t: 'msg', th: 'dohyun', text: '그날 저는 입구에서 기다리기만 했어요. 이번엔 들어갈게요', typing: 1400 },
      { t: 'wait', ms: 9000 },
      { t: 'time', hm: '01:56' },
      { t: 'flag', f: 'dohyun-in' },
      { t: 'msg', th: 'dohyun', text: '제2서고 문이 열려 있어요. 벽돌이 없어요', typing: 1300 },
      { t: 'msg', th: 'self', from: 'me', text: '도현이 들어왔어. 오지 말라고 해. 제발', typing: 1500 },
      { t: 'wait', ms: 3000 },
      { t: 'msg', th: 'dohyun', text: '서랍에 내 이름이 있어요', typing: 1800 },
      { t: 'wait', ms: 2500 },
      { t: 'unsend', th: 'dohyun', match: '서랍에 내 이름이' },
      { t: 'wait', ms: 2000 },
      { t: 'time', hm: '01:57' },
      { t: 'call', id: 'dohyun2' },
      { t: 'wait', ms: 16000 },
      { t: 'time', hm: '01:58' },
      { t: 'battery', v: 3 },
      { t: 'msg', th: 'unknown', text: '1분.', typing: 600 },
      { t: 'wait', ms: 9000 },
      { t: 'time', hm: '01:59' },
      { t: 'hush', ms: 3000 },
      { t: 'wait', ms: 2500 },
      { t: 'finale' },
    ],
  },
  {
    id: 'memo18-end',
    on: 'memo:m2:end',
    actions: [
      { t: 'wait', ms: 1500 },
      { t: 'msg', th: 'unknown', text: '{start}. 당신이 이 폰을 처음 집어 든 시각이에요. 이 폰 말고, 그쪽 시계로요.', typing: 2200 },
    ],
  },
  {
    id: 'call2-missed',
    on: 'call:dohyun2:missed',
    actions: [
      { t: 'wait', ms: 1500 },
      { t: 'msg', th: 'unknown', text: '왜 안 받아요? 도현 씨였는데.', typing: 900 },
      { t: 'msg', th: 'unknown', text: '마지막 통화였을지도 모르는데.', typing: 1600 },
    ],
  },
  { id: 'power-ch4', on: 'power:try', requires: ['ch4'], repeat: true, actions: [{ t: 'msg', th: 'unknown', text: '아직이에요.', typing: 700 }] },
  {
    id: 'power-early',
    on: 'power:try',
    requires: ['unlocked'],
    forbids: ['ch4'],
    actions: [{ t: 'wait', ms: 1200 }, { t: 'msg', th: 'unknown', text: '도현 씨가 끄라고 했죠? 안 꺼져요. 이 폰은 두 시까지 제 거예요.', typing: 1600 }],
  },
  {
    id: 'zoom-p08',
    on: 'photo:p08:zoom',
    actions: [
      { t: 'flag', f: 'zoomed-booth' },
      { t: 'wait', ms: 1400 },
      { t: 'msg', th: 'unknown', text: '맞아요. 당신이에요. 3층 창문에서 찍었어요.', typing: 1600 },
    ],
  },
  {
    id: 'v02-end',
    on: 'video:v02:end',
    actions: [
      { t: 'wait', ms: 900 },
      { t: 'sound', id: 'whisper', caption: '가까이에서 속삭이는 소리가 감지되었습니다.' },
      { t: 'vibrate', ms: [80, 60, 80] },
      { t: 'msg', th: 'unknown', text: '영상 속에서도 가까웠죠. 지금은 더 가까워요.', typing: 1100 },
    ],
  },
  {
    id: 'zoom-p09',
    on: 'photo:p09:zoom',
    actions: [
      { t: 'wait', ms: 900 },
      { t: 'sound', id: 'whisper', caption: '가까이에서 속삭이는 소리가 감지되었습니다.' },
      { t: 'vibrate', ms: [80, 60, 80] },
      { t: 'msg', th: 'unknown', text: '가까이 볼수록, 더 가까이 가요.', typing: 900 },
    ],
  },
  // Texting 도현 or 엄마 never goes through. The first time, she says why.
  {
    id: 'dohyun-blocked',
    on: 'dohyun:blocked',
    forbids: ['dohyun-blocked'],
    actions: [
      { t: 'flag', f: 'dohyun-blocked' },
      { t: 'wait', ms: 1600 },
      { t: 'msg', th: 'unknown', text: '도현 씨한테는 안 가요. 지금 이 폰은 저하고만 얘기해요.', typing: 1500 },
    ],
  },
  {
    id: 'mom-blocked',
    on: 'mom:blocked',
    forbids: ['mom-blocked'],
    actions: [
      { t: 'flag', f: 'mom-blocked' },
      { t: 'wait', ms: 1600 },
      { t: 'msg', th: 'unknown', text: '어머니께는 아무것도 안 가요. 아직은요.', typing: 1300 },
    ],
  },
  // …but what you sent him arrives, an hour late, when he reaches the school.
  {
    id: 'dohyun-late-text',
    on: 'dohyun:late-text',
    requires: ['dohyun-blocked'],
    actions: [
      { t: 'wait', ms: 2200 },
      { t: 'msg', th: 'dohyun', text: '방금 문자 하나 들어왔어요. “{toDohyun}”', typing: 1600 },
      { t: 'msg', th: 'dohyun', text: '당신이죠? 한참 전에 보낸 게 이제 왔어요. 여기 신호가 이상해요', typing: 1800 },
    ],
  },
  { id: 'radio', on: 'dial:1340', actions: [{ t: 'flag', f: 'heard-radio' }] },
  { id: 'read-mom', on: 'thread:mom', actions: [{ t: 'flag', f: 'read-mom' }] },
  { id: 'read-hyunwoo', on: 'browser:news2', actions: [{ t: 'flag', f: 'read-hyunwoo' }] },
];
