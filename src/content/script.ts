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
//   3 02호실      01:12  hidden album → the selfie → 채원 texts from inside
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
      { t: 'objective', text: '폰의 잠금을 풀자', hint: '잠금 화면 알림을 읽어 보세요. 도현이 비밀번호 규칙을 알려 주고, 카메라 알림에 촬영을 시작한 시각이 나와 있어요.' },
    ],
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
    actions: [{ t: 'msg', th: 'dohyun', text: '1시 13분이요. 영상 켜고 들어갔어요.' }],
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
        t: 'objective',
        text: '채원에게 무슨 일이 있었는지 알아내자',
        hint: '메시지 앱을 열어 보세요. 모르는 번호가 하나 있습니다.',
        nudge: { th: 'dohyun', text: '혹시 폰 열었어요? 모르는 번호로 온 메시지 있으면… 절대 답하지 마요' },
      },
      { t: 'wait', ms: 1800 },
      { t: 'msg', th: 'unknown', text: '잠금 풀었네요.', typing: 1400 },
    ],
  },
  {
    id: 'unknown-1',
    on: 'thread:unknown',
    requires: ['unlocked'],
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
      { t: 'msg', th: 'unknown', text: '기록하는 사람이에요.', typing: 1800 },
      { t: 'msg', th: 'unknown', text: '채원 씨는 지금 근무 대기 중이에요.', typing: 2200 },
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
    actions: [
      { t: 'msg', th: 'unknown', text: '채원 씨 마지막 사진, 봤어요?', typing: 2000 },
      { t: 'msg', th: 'unknown', text: '이거요.', typing: 900, attach: { kind: 'photo', id: 'p07' } },
      { t: 'flag', f: 'asked-photo' },
      {
        t: 'objective',
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
      { t: 'msg', th: 'unknown', text: '…그 사진은 보지 마요.', typing: 1300 },
      {
        t: 'objective',
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
      { t: 'hush', ms: 900 },
      { t: 'scare', kind: 'lunge', look: 'hang' },
      { t: 'wait', ms: 1700 },
      { t: 'glitch', ms: 1000 },
      { t: 'time', hm: '00:31', lost: true },
      { t: 'calllog', entry: { who: '0200', time: '23:53', kind: 'out', duration: '38:12' } },
      { t: 'wait', ms: 1600 },
      { t: 'msg', th: 'unknown', text: '봤죠?', typing: 500 },
      { t: 'objective', text: '…시간이 40분 가까이 사라졌다', hint: '곧 도현에게서 전화가 옵니다. 받으세요. 전화가 끊겼거나 놓쳤다면 전화 앱 → 최근 기록에서 도현을 눌러 다시 걸 수 있어요.' },
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
      {
        t: 'objective',
        text: '채원의 마지막 녹음을 듣자',
        hint: '녹음 앱 → “새 녹음 17”. 소리를 켜고, 이어폰이 있다면 끼세요.',
        nudge: { th: 'dohyun', text: '녹음 들어 봤어요? 녹음 앱이요. 끝까지요' },
      },
    ],
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
        t: 'objective',
        text: '모르는 번호가 이름을 묻는다',
        hint: '메시지 앱 → 모르는 번호. 알려 줄지 말지는 당신 선택입니다. (이름은 이 기기에만 저장됩니다)',
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
      { t: 'chapter', n: 3, title: '02호실' },
      { t: 'time', hm: '01:12' },
      {
        t: 'objective',
        text: '사진 앱의 숨김 앨범을 열자',
        hint: '메모 앱 “비번들 (보지 마)”에 힌트가 있습니다. 그 방송의 주파수는 메모 “괴담 정리”나 브라우저의 기록 001에 나와요.',
        nudge: { th: 'unknown', text: '숫자를 읽던 그 방송. 주파수요.' },
      },
      { t: 'msg', th: 'unknown', text: '채원 씨가 숨겨 둔 사진들이에요. 보고 싶죠?', typing: 1800, attach: { kind: 'album' } },
      // Found the code early? The album has finished syncing now.
      { t: 'emit', ev: 'album:recheck' },
    ],
  },

  // ── 3. 02호실 ──────────────────────────────────────────────────────────
  {
    id: 'album-open',
    on: 'album:unlock',
    requires: ['ch3'],
    actions: [
      { t: 'flag', f: 'album-open' },
      { t: 'objective', text: '숨김 앨범을 끝까지 넘겨 보자', hint: '사진을 연 뒤 옆으로 넘기세요. 마지막 사진까지.', nudge: { th: 'unknown', text: '끝까지 넘겨요.' } },
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
      { t: 'objective', text: '숨김 앨범을 끝까지 넘겨 보자', hint: '사진 앱 → 숨김. 사진을 연 뒤 옆으로 넘기세요. 마지막 사진까지.', nudge: { th: 'unknown', text: '끝까지 넘겨요.' } },
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
      { t: 'hush', ms: 700 },
      { t: 'scare', kind: 'lunge', look: 'profile' },
      { t: 'wait', ms: 1800 },
      { t: 'glitch', ms: 700 },
      { t: 'time', hm: '01:38', lost: true },
      { t: 'wait', ms: 2600 },
      { t: 'msg', th: 'self', from: 'me', text: '여기 너무 추워' },
      { t: 'objective', text: '누군가 이 폰으로 “나에게” 메시지를 보냈다', hint: '메시지 앱 → 나에게.', nudge: { th: 'self', from: 'me', text: '대답해 제발' } },
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
      { t: 'msg', th: 'self', from: 'me', text: '그 여자가 두 시에 교대한대. 내가 남아야 한대', typing: 2400 },
      { t: 'msg', th: 'self', from: 'me', text: '기록보관소 사이트 013번. 그 여자가 무서워하는 게 거기 있어', typing: 2600, attach: { kind: 'archive' } },
      { t: 'msg', th: 'self', from: 'me', text: '라디오 숫자 순서대로 열어야 나와. 메모에 적어 놨어', typing: 2000 },
      { t: 'wait', ms: 1500 },
      { t: 'draft', th: 'self', text: '그 여자 지금 내 뒤에' },
      { t: 'time', hm: '01:44' },
      {
        t: 'objective',
        text: '브라우저의 “심야 기록보관소”에서 기록 013을 찾자',
        hint: '메모 “괴담 정리”의 숫자 순서: 기록 001 → 003 → 007을 다른 기록을 섞지 않고 차례로 여세요.',
        nudge: { th: 'self', from: 'me', text: '001 003 007. 순서대로. 중간에 다른 거 열면 안 돼' },
      },
      { t: 'wait', ms: 6000 },
      { t: 'msg', th: 'unknown', text: '채원 씨랑 얘기하지 마세요.', typing: 1200 },
      { t: 'wait', ms: 7000 },
      { t: 'photo', id: 'p08' },
      { t: 'msg', th: 'unknown', text: '잘 나왔네요.', typing: 1600, attach: { kind: 'photo', id: 'p08' } },
      { t: 'msg', th: 'unknown', text: '두 번 눌러서 확대해 봐요. 부스 안이요.', typing: 1500 },
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
      { t: 'notify', app: 'index', title: '야간 색인', body: '설치가 완료되었습니다.' },
      { t: 'wait', ms: 2200 },
      { t: 'msg', th: 'unknown', text: '{name}, 열쇠를 찾았네요.', typing: 1400 },
      { t: 'msg', th: 'unknown', text: '그건 쓰면 안 돼요.', typing: 1200 },
      { t: 'msg', th: 'unknown', text: '열쇠를 쓰면 색인이 끝나요. 아무도 기록되지 않아요. 아무도 기억되지 않아요.', typing: 2600 },
      {
        t: 'objective',
        text: '02:00이 오기 전에 준비하자',
        hint: '02:00에 선택의 순간이 옵니다. 열쇠(HAEWON-0200)와 첫 근무자의 이름(브라우저 기록 003)을 기억해 두세요. 새로 생긴 사진과 녹음도 확인해 보세요.',
      },
      { t: 'sound', id: 'heartbeat' },
      // One thing every in-game minute, until 02:00.
      { t: 'wait', ms: 9000 },
      { t: 'time', hm: '01:51' },
      { t: 'note', id: 'n4' },
      { t: 'memo', id: 'm2' },
      { t: 'notify', app: 'memos', title: '녹음', body: '새 녹음 18이 저장되었습니다.' },
      { t: 'msg', th: 'unknown', text: '녹음 하나 더 있어요. 이번엔 채원 씨 거 아니에요.', typing: 1800, attach: { kind: 'memo', id: 'm2' } },
      { t: 'wait', ms: 11000 },
      { t: 'time', hm: '01:52' },
      { t: 'msg', th: 'unknown', text: '이 폰 시계는 {clock}이지만, 당신 쪽은 {real}이죠?', typing: 2000 },
      { t: 'wait', ms: 10000 },
      { t: 'time', hm: '01:53' },
      { t: 'msg', th: 'dohyun', text: '곧 두 시예요. 제발 그 폰 꺼요', typing: 800 },
      { t: 'wait', ms: 5000 },
      { t: 'unsend', th: 'dohyun', match: '그 폰 꺼요' },
      { t: 'wait', ms: 6000 },
      { t: 'time', hm: '01:54' },
      { t: 'photo', id: 'p09' },
      { t: 'msg', th: 'unknown', text: '또 찍었어요. 이번엔 뒤에 누가 있네요.', typing: 1600, attach: { kind: 'photo', id: 'p09' } },
      { t: 'msg', th: 'unknown', text: '확대해서 봐요.', typing: 800 },
      { t: 'wait', ms: 10000 },
      { t: 'time', hm: '01:55' },
      { t: 'battery', v: 4 },
      { t: 'dialog', title: '배터리 부족', body: '배터리가 4% 남았습니다. 저전력 모드를 켤 수 없습니다: 야간 색인이 사용 중.' },
      { t: 'wait', ms: 10000 },
      { t: 'time', hm: '01:56' },
      { t: 'msg', th: 'self', from: 'me', text: '그 여자가 일어났어. 거의 다 왔대', typing: 1500 },
      { t: 'wait', ms: 9000 },
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
      { t: 'msg', th: 'unknown', text: '…아니었나.', typing: 1400 },
    ],
  },
  { id: 'power-ch4', on: 'power:try', requires: ['ch4'], repeat: true, actions: [{ t: 'msg', th: 'unknown', text: '아직이에요.', typing: 700 }] },
  {
    id: 'zoom-p08',
    on: 'photo:p08:zoom',
    actions: [
      { t: 'wait', ms: 1400 },
      { t: 'msg', th: 'unknown', text: '맞아요. 당신이에요. 3층 창문에서 찍었어요.', typing: 1600 },
    ],
  },
  {
    id: 'zoom-p09',
    on: 'photo:p09:zoom',
    actions: [
      { t: 'wait', ms: 900 },
      { t: 'sound', id: 'whisper' },
      { t: 'vibrate', ms: [80, 60, 80] },
      { t: 'msg', th: 'unknown', text: '뒤돌아보지 마요.', typing: 500 },
    ],
  },
  { id: 'radio', on: 'dial:1340', actions: [{ t: 'flag', f: 'heard-radio' }] },
  { id: 'read-mom', on: 'thread:mom', actions: [{ t: 'flag', f: 'read-mom' }] },
];
