import type { Beat } from '../engine/types';

// ─────────────────────────────────────────────────────────────────────────
// 12% — the story, as beats.
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
      { t: 'objective', text: '폰의 잠금을 풀자', hint: '도현이 보낸 비번은 지워졌지만, 바로 뒤 문자에 “걔가 어제 학교 들어간 시간이랑 똑같아요”라고 남아 있어요. 채원이 들어간 시각은 카메라 알림에. 네 자리로.' },
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
    actions: [{ t: 'wait', ms: 900 }, { t: 'msg', th: 'unknown', text: '문 열어 뒀어요. 도현 씨가 다 알려 줬잖아요.', typing: 1200 }],
  },
  {
    id: 'lock-idle',
    on: 'lock:idle',
    forbids: ['unlocked'],
    actions: [{ t: 'msg', th: 'unknown', text: '들어오세요.' }],
  },
  {
    id: 'lock-idle2',
    on: 'lock:idle2',
    forbids: ['unlocked'],
    actions: [{ t: 'msg', th: 'unknown', text: '지금 보고 있죠?' }],
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
      { t: 'msg', th: 'unknown', text: '들어왔네요. 채원 씨도 1시 13분에 들어왔어요.', typing: 1800 },
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
      { t: 'msg', th: 'unknown', text: '이름 적는 사람이요.', typing: 800 },
      { t: 'msg', th: 'unknown', text: '두 시에 여기 있는 사람들 거.', typing: 1200 },
      { t: 'msg', th: 'unknown', text: '채원 씨 것도 제가 적었어요.', typing: 1400 },
      { t: 'msg', th: 'unknown', text: '오늘은 그쪽 차례고요.', typing: 1000 },
      { t: 'emit', ev: 'c1:done' },
    ],
  },
  {
    id: 'c1-yes',
    on: 'choice:c1:yes',
    actions: [
      { t: 'msg', th: 'unknown', text: '고마워요. 그 폰은 거기 있어야 돼요.', typing: 2400 },
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
      { t: 'msg', th: 'unknown', text: '채원 씨 마지막 사진 봤어요?', typing: 2000 },
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
      { t: 'msg', th: 'dohyun', text: '알았어요 그럼 이것만', typing: 1000 },
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
      { t: 'msg', th: 'dohyun', text: '끊겼어요? 다시 걸게요', typing: 900 },
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
      { t: 'msg', th: 'dohyun', text: '계속 끊기네 문자로 할게요', typing: 1000 },
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
      { t: 'msg', th: 'dohyun', text: '이거 채원이 마지막 녹음이에요', typing: 1000, attach: { kind: 'memo', id: 'm1' } },
      { t: 'msg', th: 'dohyun', text: '끝까지 들어 주세요', typing: 600 },
      // The rule of the night, in one plain line, before any of the lore.
      { t: 'msg', th: 'dohyun', text: '채원이 찍으려던 그 괴담 있잖아요', typing: 800 },
      { t: 'msg', th: 'dohyun', text: '두 시에 학교 안에 있으면 이름이 적힌대요', typing: 1000 },
      { t: 'msg', th: 'dohyun', text: '다음 사람이 들어와야 나온다고', typing: 700 },
      { t: 'msg', th: 'dohyun', text: '말도 안 되는 거 알아요', typing: 700 },
      { t: 'msg', th: 'dohyun', text: '근데 채원이가 진짜 안 나와요', typing: 800 },
      { t: 'msg', th: 'dohyun', text: '저 지금 학교 가요. 20분이면 가요', typing: 1800 },
      { t: 'msg', th: 'unknown', text: '문 밀어 봤어요? 두 시까진 안 열려요.', typing: 1600 },
      {
        t: 'objective', app: 'memos',
        text: '채원의 마지막 녹음을 듣자',
        hint: '녹음 앱 → “새 녹음 17”. 소리를 켜면 좋고, 꺼져 있어도 자막이 나옵니다.',
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
      { t: 'msg', th: 'unknown', text: '그 계단 영상도 있어요. 끝까지 봐요.', typing: 1400, attach: { kind: 'photo', id: 'v01' } },
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
      { t: 'msg', th: 'unknown', text: '채원 씨 영상 다 날아간 거 아니에요.', typing: 1600, attach: { kind: 'photo', id: 'v01' } },
    ],
  },
  {
    id: 'v01-end',
    on: 'video:v01:end',
    actions: [{ t: 'wait', ms: 1400 }, { t: 'msg', th: 'unknown', text: '계단 끝이요. 채원 씨 거기까지 올라갔어요.', typing: 1800 }],
  },
  {
    id: 'memo-end',
    on: 'memo:m1:end',
    actions: [
      { t: 'flag', f: 'memo-done' },
      { t: 'wait', ms: 1800 },
      { t: 'msg', th: 'unknown', text: '이제 목소리도 알죠.', typing: 1500 },
      { t: 'msg', th: 'unknown', text: '앉으라고 했잖아요.', typing: 1600 },
      { t: 'msg', th: 'unknown', text: '이름이 뭐예요?', typing: 1800 },
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
      { t: 'msg', th: 'unknown', text: '적어 둘게요.', typing: 1900 },
      { t: 'msg', th: 'unknown', text: '선물이요.', typing: 500 },
      { t: 'msg', th: 'unknown', text: '숨김 앨범 비번, 채원 씨가 제일 무서워하던 방송이에요.', typing: 2200 },
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
      { t: 'msg', th: 'unknown', text: '채원 씨가 숨겨 둔 사진이요. 보고 싶죠?', typing: 1800, attach: { kind: 'album' } },
      // Found the code early? The album has finished syncing now.
      { t: 'emit', ev: 'album:recheck' },
      { t: 'wait', ms: 26000 },
      { t: 'msg', th: 'dohyun', text: '택시 기다리는 중', typing: 500 },
      { t: 'msg', th: 'dohyun', text: '폰 끄라는 거 제보 메일 마지막 줄이었어요', typing: 1100 },
      { t: 'msg', th: 'dohyun', text: '채원이가 캡처해서 보여 줬었는데', typing: 800 },
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
      { t: 'msg', th: 'unknown', text: '비번은 벌써 알았네요. 사진 이제 다 왔어요.', typing: 1800, attach: { kind: 'album' } },
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
      { t: 'msg', th: 'unknown', text: '채원 씨 카드예요. 그쪽 것도 만드는 중이에요.', typing: 1700 },
    ],
  },
  {
    id: 'selfie',
    on: 'photo:h05:dwell',
    requires: ['ch3'],
    actions: [
      { t: 'flag', f: 'selfie-scare' },
      // No lunge this time: the photo changes while you look at it. Far back between the
      // shelves first, everything goes quiet, then she's at 채원's cheek, breathing.
      { t: 'flag', f: 'h05-far' },
      { t: 'hush', ms: 2600, still: true },
      { t: 'flag', f: 'h05-revealed' },
      { t: 'sound', id: 'breath', caption: '아주 가까이에서 숨소리가 감지되었습니다.' },
      { t: 'vibrate', ms: [30] },
      { t: 'wait', ms: 2600 },
      { t: 'glitch', ms: 700 },
      { t: 'time', hm: '01:38', lost: true },
      { t: 'calllog', entry: { who: '엄마', time: '01:37', kind: 'out', duration: '0:41' } },
      { t: 'wait', ms: 2600 },
      { t: 'msg', th: 'self', from: 'me', text: '여기 너무 추워' },
      { t: 'objective', app: 'messages', text: '누군가 이 폰으로 “나에게” 메시지를 보냈다', hint: '메시지 앱 → 나에게.', nudge: { th: 'self', from: 'me', text: '대답해 제발' } },
      { t: 'wait', ms: 22000 },
      { t: 'msg', th: 'mom', text: '채원아 방금 전화 너니?', typing: 1200 },
      { t: 'msg', th: 'mom', text: '아무 말도 안 하고 숨소리만 들리더라', typing: 1600 },
      { t: 'msg', th: 'mom', text: '엄마 무섭다', typing: 600 },
      { t: 'msg', th: 'mom', text: '채원아 한마디만 해 제발', typing: 1200 },
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
      { t: 'msg', th: 'self', from: 'me', text: '도와줘 제발', typing: 600 },
      { t: 'msg', th: 'self', from: 'me', text: '여기 문이 없어 서랍만 있어', typing: 1600 },
      { t: 'msg', th: 'self', from: 'me', text: '두시에 다음 사람 적히면 나 나갈 수 있대', typing: 2400 },
      { t: 'msg', th: 'self', from: 'me', text: '나도 그 부스에서 폰 주웠어 박현우라는 사람 거', typing: 2200 },
      { t: 'msg', th: 'self', from: 'me', text: '내 폰 두시 되자마자 손에서 없어졌어', typing: 900 },
      { t: 'msg', th: 'self', from: 'me', text: '그 여자가 부스에 갖다 놓는 거야 다음 사람 줍게', typing: 1300 },
      { t: 'msg', th: 'self', from: 'me', text: '제보 메일도 그 여자였어', typing: 600 },
      { t: 'msg', th: 'self', from: 'me', text: '박현우 폰 여기 서랍에 있어 12%', typing: 1200 },
      { t: 'msg', th: 'self', from: 'me', text: '112도 안 걸려 나에게로만 보내져', typing: 1200 },
      { t: 'msg', th: 'self', from: 'me', text: '너 지금 내 폰 들고 있지', typing: 1300 },
      { t: 'msg', th: 'self', from: 'me', text: '그럼 다음 너야', typing: 700 },
      { t: 'msg', th: 'self', from: 'me', text: '기록보관소 013', typing: 1100 },
      { t: 'msg', th: 'self', from: 'me', text: '그 여자 그거 무서워해', typing: 1500, attach: { kind: 'archive' } },
      { t: 'msg', th: 'self', from: 'me', text: '라디오 숫자 순서대로 열어야 돼 메모에 적어놨어', typing: 2000 },
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
      { t: 'msg', th: 'unknown', text: '채원 씨랑 얘기하지 마요.', typing: 1200 },
      { t: 'wait', ms: 7000 },
      { t: 'photo', id: 'p08' },
      { t: 'msg', th: 'unknown', text: '잘 나왔네요.', typing: 1600, attach: { kind: 'photo', id: 'p08' } },
      { t: 'msg', th: 'unknown', text: '두 번 눌러서 확대해 봐요. 전화부스 안이요.', typing: 1500 },
      { t: 'wait', ms: 6000 },
      { t: 'msg', th: 'dohyun', text: '택시가 안 잡혀서 늦었어요', typing: 600 },
      { t: 'msg', th: 'dohyun', text: '학교 앞이에요 부스 쪽으로 가요', typing: 800 },
      { t: 'emit', ev: 'dohyun:late-text' },
      { t: 'wait', ms: 7000 },
      { t: 'sound', id: 'knock', caption: '유리를 두드리는 소리가 감지되었습니다.' },
      { t: 'wait', ms: 1800 },
      { t: 'msg', th: 'unknown', text: '방금 유리 두드린 거 도현 씨 아니에요.', typing: 1600 },
      { t: 'wait', ms: 6000 },
      { t: 'reboot', wallpaper: 'booth' },
      { t: 'msg', th: 'unknown', text: '배경화면 바꿔 놨어요. 마음에 들어요?' },
    ],
  },
  // the students' weather notebook: the one place her given name was written down
  { id: 'read-r002', on: 'browser:r002', actions: [{ t: 'flag', f: 'read-r002' }] },
  // reading the archive in chapter 3: record 009 starts being written — about you
  {
    id: 'r009-you',
    on: 'browser:r001',
    requires: ['self-contact'],
    forbids: ['found-key'],
    actions: [
      { t: 'wait', ms: 25000 },
      { t: 'flag', f: 'r009-you' },
      { t: 'msg', th: 'unknown', text: '009 봤어요? 지금 쓰는 중이에요. {name} 씨 거.', typing: 1600 },
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
    actions: [{ t: 'wait', ms: 1500 }, { t: 'msg', th: 'unknown', text: '아직이에요, {name}. 그 기록은 아직 쓰는 중이에요.', typing: 2200 }],
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
      { t: 'msg', th: 'unknown', text: '{name}, 그거 찾았네요.', typing: 1400 },
      { t: 'msg', th: 'unknown', text: '그건 쓰면 안 돼요.', typing: 1200 },
      { t: 'msg', th: 'unknown', text: '…써요. 두 시에. 제 이름이랑 같이.', typing: 900 },
      { t: 'wait', ms: 4500 },
      { t: 'unsend', th: 'unknown', match: '…써요. 두 시에' },
      { t: 'wait', ms: 1200 },
      { t: 'msg', th: 'unknown', text: '앱 하나 깔아 뒀어요.', typing: 900 },
      { t: 'msg', th: 'unknown', text: '지금 안에 있는 사람들이에요.', typing: 1300 },
      { t: 'msg', th: 'unknown', text: '그거 쓰면 여기 이름 다 지워져요. 채원 씨 것도.', typing: 2100 },
      { t: 'msg', th: 'unknown', text: '…제 것도.', typing: 500 },
      {
        t: 'objective', app: 'index',
        text: '02:00에 삭제 코드와 처음 갇힌 사람의 이름이 필요하다',
        hint: '02:00에 선택의 순간이 옵니다. 삭제 코드(HAEWON-0200, 기록 013)와 처음 갇힌 사람의 이름을 기억해 두세요. 성은 기록 003에, 가려진 이름은 기록 013의 마지막 줄이 가리키는 기록(옥상 관측 노트, 기록 002)에 있습니다. 02:00 화면에서도 읽은 기록을 다시 볼 수 있어요. 새로 생긴 녹음 18도 들어 보세요.',
      },
      { t: 'sound', id: 'heartbeat', caption: '심장 박동 같은 소리가 계속 감지됩니다.' },
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
      { t: 'msg', th: 'unknown', text: '이 폰은 {clock}인데 거긴 지금 {real}이죠?', typing: 2000 },
      { t: 'wait', ms: 12000 },
      { t: 'time', hm: '01:53' },
      { t: 'msg', th: 'dohyun', text: '전화부스 보여요 그쪽도 보여요', typing: 600 },
      { t: 'msg', th: 'dohyun', text: '거기 있어요 움직이지 말고', typing: 600 },
      { t: 'wait', ms: 4000 },
      { t: 'photo', id: 'v02' },
      { t: 'msg', th: 'dohyun', text: '근데 그쪽 뒤에 서 있는 사람 누구예요?', typing: 1400, attach: { kind: 'photo', id: 'v02' } },
      { t: 'wait', ms: 6000 },
      { t: 'time', hm: '01:54' },
      { t: 'msg', th: 'dohyun', text: '뒤돌아보지 마요.', typing: 500 },
      { t: 'msg', th: 'unknown', text: '돌아봐도 돼요.', typing: 900 },
      // Two voices, one neck. Nothing typed: you either look or you don't.
      {
        t: 'choice',
        th: 'dohyun',
        id: 'c5',
        options: [
          { id: 'turn', label: '(뒤돌아본다)', reply: '' },
          { id: 'hold', label: '(돌아보지 않는다)', reply: '' },
        ],
      },
      { t: 'wait', ms: 11000 },
      { t: 'unchoice', id: 'c5' },
      { t: 'time', hm: '01:55' },
      { t: 'battery', v: 4 },
      { t: 'dialog', title: '배터리 부족', body: '배터리가 4% 남았습니다. 저전력 모드를 켤 수 없습니다: 야간 출입 기록이 사용 중.' },
      { t: 'msg', th: 'dohyun', text: '3층 창문에 채원이 있어요', typing: 700 },
      { t: 'msg', th: 'dohyun', text: '손 흔들어요 저한테', typing: 500 },
      { t: 'msg', th: 'dohyun', text: '그때 입구에서 기다리기만 했는데', typing: 1000 },
      { t: 'msg', th: 'dohyun', text: '저 들어갈게요', typing: 500 },
      { t: 'msg', th: 'self', from: 'me', text: '도현이 들어오려고 해??', typing: 800 },
      { t: 'msg', th: 'self', from: 'me', text: '오지 말라고 해 제발', typing: 700 },
      // The one thing you can still change tonight. Whoever is inside at 02:00 can be written;
      // say nothing and he goes in.
      {
        t: 'choice',
        th: 'dohyun',
        id: 'c4',
        options: [
          { id: 'stop', label: '들어오지 마요. 밖에 있어요.' },
          { id: 'go', label: '채원 씨 데리고 나와요.' },
        ],
      },
      { t: 'wait', ms: 14000 },
      { t: 'unchoice', id: 'c4' },
      { t: 'time', hm: '01:56' },
      { t: 'emit', ev: 'dohyun:door' },
      { t: 'wait', ms: 12500 },
      { t: 'time', hm: '01:57' },
      { t: 'emit', ev: 'dohyun:call' },
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
  // ── 01:54, behind you ──
  {
    id: 'c5-turn',
    on: 'choice:c5:turn',
    actions: [
      { t: 'flag', f: 'turned' },
      { t: 'scare', kind: 'turn' },
      { t: 'msg', th: 'dohyun', text: '방금 돌아봤을 때 그 사람도 같이 돌았어요', typing: 1100 },
      { t: 'msg', th: 'dohyun', text: '등에 붙어서', typing: 500 },
      { t: 'msg', th: 'unknown', text: '거봐요. 아무도 없죠.', typing: 800 },
    ],
  },
  {
    id: 'c5-hold',
    on: 'choice:c5:hold',
    actions: [
      { t: 'flag', f: 'held' },
      { t: 'wait', ms: 1200 },
      { t: 'msg', th: 'dohyun', text: '잘했어요', typing: 500 },
      { t: 'msg', th: 'dohyun', text: '아직 있어요 바로 뒤에', typing: 1000 },
      { t: 'msg', th: 'unknown', text: '괜찮아요. 두 시엔 어차피 마주 볼 거예요.', typing: 1600 },
    ],
  },
  // ── 01:55, the door: he goes in — or, because you told him to, he doesn't ──
  {
    id: 'c4-stop',
    on: 'choice:c4:stop',
    actions: [
      { t: 'flag', f: 'kept-out' },
      { t: 'wait', ms: 1400 },
      { t: 'msg', th: 'dohyun', text: '…지금 그게 와요? 신호가 이상해요', typing: 1200 },
      { t: 'msg', th: 'dohyun', text: '알았어요', typing: 500 },
      { t: 'msg', th: 'dohyun', text: '안 들어갈게요 여기 있을게요', typing: 1400 },
    ],
  },
  { id: 'c4-go', on: 'choice:c4:go', actions: [{ t: 'wait', ms: 1400 }, { t: 'msg', th: 'dohyun', text: '네 데리고 나올게요', typing: 1200 }] },
  {
    id: 'dohyun-goes-in',
    on: 'dohyun:door',
    forbids: ['kept-out'],
    actions: [
      { t: 'flag', f: 'dohyun-in' },
      { t: 'msg', th: 'dohyun', text: '제2서고 문 열려 있어요', typing: 800 },
      { t: 'msg', th: 'dohyun', text: '벽돌이 없어요', typing: 500 },
      { t: 'msg', th: 'self', from: 'me', text: '도현이 들어왔어', typing: 800 },
      { t: 'msg', th: 'self', from: 'me', text: '왜 안 막았어', typing: 700 },
      { t: 'wait', ms: 3000 },
      { t: 'msg', th: 'dohyun', text: '서랍에 내 이름이 있어요', typing: 1800 },
      { t: 'wait', ms: 2500 },
      { t: 'unsend', th: 'dohyun', match: '서랍에 내 이름이' },
    ],
  },
  {
    id: 'dohyun-stays-out',
    on: 'dohyun:door',
    requires: ['kept-out'],
    actions: [
      { t: 'msg', th: 'dohyun', text: '창문에서 채원이가 없어졌어요', typing: 1300 },
      { t: 'msg', th: 'self', from: 'me', text: '도현이 안 왔어', typing: 900 },
      { t: 'msg', th: 'self', from: 'me', text: '잘했어 진짜', typing: 600 },
      { t: 'wait', ms: 2600 },
      { t: 'msg', th: 'self', from: 'me', text: '근데 그럼 두시에 여기 나밖에 없어', typing: 2200 },
      { t: 'wait', ms: 1800 },
      { t: 'msg', th: 'unknown', text: '착하네요.', typing: 500 },
      { t: 'msg', th: 'unknown', text: '그럼 채원 씨는 계속 여기 있어야 돼요. 그쪽이 대신 오든가.', typing: 1900 },
    ],
  },
  { id: 'dohyun-call', on: 'dohyun:call', forbids: ['kept-out'], actions: [{ t: 'call', id: 'dohyun2' }] },
  {
    id: 'dohyun-call-out',
    on: 'dohyun:call',
    requires: ['kept-out'],
    actions: [
      { t: 'sound', id: 'knock', caption: '유리를 두드리는 소리가 감지되었습니다.' },
      { t: 'wait', ms: 1800 },
      { t: 'msg', th: 'dohyun', text: '저 아니에요. 저 지금 정문이에요', typing: 900 },
      { t: 'msg', th: 'dohyun', text: '전화부스 옆에 누가 서 있어요', typing: 1400 },
    ],
  },
  {
    id: 'memo18-end',
    on: 'memo:m2:end',
    actions: [
      { t: 'wait', ms: 1500 },
      { t: 'msg', th: 'unknown', text: '{start}.', typing: 600 },
      { t: 'msg', th: 'unknown', text: '이 폰 처음 집었을 때요. 그쪽 시계로.', typing: 1600 },
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
    actions: [{ t: 'wait', ms: 1200 }, { t: 'msg', th: 'unknown', text: '도현 씨가 끄래요? 안 꺼져요. 두 시까진 제 거예요.', typing: 1600 }],
  },
  {
    id: 'zoom-p08',
    on: 'photo:p08:zoom',
    actions: [
      { t: 'flag', f: 'zoomed-booth' },
      { t: 'wait', ms: 1400 },
      { t: 'msg', th: 'unknown', text: '네, 그쪽이에요. 3층에서 찍었어요.', typing: 1600 },
    ],
  },
  {
    id: 'v02-end',
    on: 'video:v02:end',
    actions: [
      { t: 'wait', ms: 900 },
      { t: 'sound', id: 'whisper', caption: '가까이에서 속삭이는 소리가 감지되었습니다.' },
      { t: 'vibrate', ms: [80, 60, 80] },
      { t: 'msg', th: 'unknown', text: '영상 다시 틀어 봐요. 아까보다 가까워요.', typing: 1100 },
    ],
  },
  {
    id: 'zoom-p09',
    on: 'photo:p09:zoom',
    actions: [
      { t: 'wait', ms: 900 },
      { t: 'sound', id: 'whisper', caption: '가까이에서 속삭이는 소리가 감지되었습니다.' },
      { t: 'vibrate', ms: [80, 60, 80] },
      { t: 'msg', th: 'unknown', text: '확대하지 마요. 저도 가까이 가요.', typing: 900 },
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
      { t: 'msg', th: 'unknown', text: '도현 씨한테는 안 가요. 이 폰은 저랑만 얘기해요.', typing: 1500 },
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
      { t: 'msg', th: 'dohyun', text: '이거 그쪽이죠? 한참 전에 보낸 게 이제 왔어요', typing: 1300 },
      { t: 'msg', th: 'dohyun', text: '여기 신호 이상해요', typing: 500 },
    ],
  },
  // ── She sees what you're looking at ───────────────────────────────────
  // Small, once each: the phone answers the screen you just opened.
  {
    id: 'sees-notes',
    on: 'app:notes',
    requires: ['unlocked'],
    forbids: ['ch3'],
    actions: [
      { t: 'wait', ms: 7000 },
      { t: 'msg', th: 'unknown', text: '채원 씨 메모 읽고 있죠. 엄마 생신 거는 넘겨요. 그건 좀 슬퍼서.', typing: 2000 },
    ],
  },
  {
    // typing… nothing… then it's there anyway
    id: 'sees-gallery',
    on: 'app:gallery',
    requires: ['call1-done'],
    forbids: ['album-open'],
    actions: [
      { t: 'wait', ms: 4000 },
      { t: 'typing', th: 'unknown', ms: 2600 },
      { t: 'wait', ms: 3200 },
      { t: 'msg', th: 'unknown', text: '01:40 열람실 사진, 오래 들여다보지 마요. 거기 앉아 있던 건 제가 아니에요.' },
    ],
  },
  {
    id: 'sees-browser',
    on: 'app:browser',
    requires: ['self-contact'],
    actions: [
      { t: 'wait', ms: 5000 },
      { t: 'msg', th: 'unknown', text: '채원 씨는 그 사이트에서 순서 세 번 틀렸어요.', typing: 1500 },
    ],
  },
  {
    // reading the missing-person record: she helps — and the record takes it back
    id: 'r003-help',
    on: 'browser:r003',
    requires: ['self-contact'],
    actions: [
      { t: 'wait', ms: 2400 },
      { t: 'msg', th: 'unknown', text: '성은 거기 있어요. 이름은… 저는 못 불러요.', typing: 1300 },
      { t: 'wait', ms: 4200 },
      { t: 'unsend', th: 'unknown', match: '성은 거기 있어요' },
    ],
  },
  {
    // chapter 4: it was written before you opened the app
    id: 'ready-ch4',
    on: 'app:messages',
    requires: ['ch4'],
    actions: [{ t: 'msg', th: 'unknown', text: '열 줄 알았어요.' }],
  },
  // 채원's ordinary days: close one and go home — someone remembers that smile.
  { id: 'saw-life', on: 'photo:l*', actions: [{ t: 'flag', f: 'saw-life' }] },
  {
    id: 'life-smile',
    on: 'home',
    requires: ['saw-life', 'unlocked'],
    actions: [
      { t: 'wait', ms: 2600 },
      { t: 'msg', th: 'unknown', text: '그때도 이렇게 웃었어요.', typing: 1400 },
    ],
  },
  // the bus-stop photo, first seen before chapter 3: look again later and its time has changed
  { id: 'l4-early', on: 'photo:l4', forbids: ['ch3'], actions: [{ t: 'flag', f: 'l4-early' }] },
  // …and in chapter 4 the shelter glass shows someone behind the camera
  { id: 'l4-seen', on: 'photo:l4', forbids: ['ch4'], actions: [{ t: 'flag', f: 'l4-seen' }] },
  {
    id: 'l4-ghost',
    on: 'photo:l4',
    requires: ['ch4', 'l4-seen'],
    actions: [
      { t: 'wait', ms: 3200 },
      { t: 'msg', th: 'unknown', text: '정류장 사진 다시 봤죠. 유리에 비친 거 봤어요?', typing: 1600 },
    ],
  },
  // you start typing to her — she knows before you send it
  {
    id: 'dont-send',
    on: 'typing:unknown',
    requires: ['ch3'],
    actions: [
      { t: 'wait', ms: 900 },
      { t: 'msg', th: 'unknown', text: '그거 보내지 마요.', typing: 700 },
    ],
  },
  { id: 'radio', on: 'dial:1340', actions: [{ t: 'flag', f: 'heard-radio' }] },
  { id: 'read-mom', on: 'thread:mom', actions: [{ t: 'flag', f: 'read-mom' }] },
  { id: 'read-hyunwoo', on: 'browser:news2', actions: [{ t: 'flag', f: 'read-hyunwoo' }] },
];
