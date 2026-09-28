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
      { t: 'objective', text: '폰의 잠금을 풀자', hint: '잠금 화면에 온 알림을 읽어 보세요. 도현이 비밀번호 힌트를 보냈습니다. 배경 화면에도 무언가 찍혀 있어요.' },
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
      { t: 'objective', text: '채원에게 무슨 일이 있었는지 알아내자', hint: '메시지 앱을 열어 보세요. 모르는 번호가 하나 있습니다.' },
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
      { t: 'flag', f: 'asked-photo' },
      { t: 'objective', text: '채원이 마지막으로 찍은 사진을 확인하자', hint: '사진 앱 → 최근 항목의 맨 마지막 사진(01:59).' },
    ],
  },
  {
    id: 'p07-seen',
    on: 'photo:p07',
    requires: ['unlocked'],
    actions: [
      { t: 'wait', ms: 1500 },
      { t: 'msg', th: 'unknown', text: '어둡죠? 밝게 해 봐요.', typing: 1300 },
      { t: 'objective', text: '마지막 사진을 밝게 보정하자', hint: '사진을 연 채로 아래의 [편집]을 누르고, 밝기를 끝까지 올려 보세요.' },
    ],
  },
  {
    id: 'reveal',
    on: 'photo:p07:reveal',
    actions: [
      { t: 'flag', f: 'reveal-scare' },
      { t: 'scare', kind: 'lunge' },
      { t: 'wait', ms: 1700 },
      { t: 'glitch', ms: 1000 },
      { t: 'time', hm: '00:31', lost: true },
      { t: 'wait', ms: 1600 },
      { t: 'msg', th: 'unknown', text: '봤죠?', typing: 500 },
      { t: 'objective', text: '…시간이 40분 가까이 사라졌다', hint: '잠시 기다려 보세요. 누군가 전화를 걸어올 겁니다.' },
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
  {
    id: 'call1-done',
    on: 'call1:done',
    actions: [
      { t: 'flag', f: 'call1-done' },
      { t: 'chapter', n: 2, title: '목소리' },
      { t: 'time', hm: '00:47' },
      { t: 'objective', text: '채원의 마지막 녹음을 듣자', hint: '녹음 앱 → “새 녹음 17”. 소리를 켜고, 이어폰이 있다면 끼세요.' },
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
      { t: 'objective', text: '02:00이 이름을 묻는다', hint: '메시지 앱 → 02:00. 알려 줄지 말지는 당신 선택입니다. (이름은 이 기기에만 저장됩니다)' },
    ],
  },
  {
    id: 'c2-name',
    on: 'choice:c2:name',
    actions: [
      { t: 'flag', f: 'gave-name' },
      { t: 'msg', th: 'unknown', text: '{name}.', typing: 1300 },
      { t: 'msg', th: 'unknown', text: '좋은 이름이네요. 적어 둘게요.', typing: 1900 },
      { t: 'msg', th: 'unknown', text: '선물이에요. 숨김 앨범 비밀번호는 1340.', typing: 2200 },
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
      { t: 'chapter', n: 3, title: '02호실' },
      { t: 'time', hm: '01:12' },
      {
        t: 'objective',
        text: '사진 앱의 숨김 앨범을 열자',
        hint: '메모 앱 “비번들 (보지 마)”에 힌트가 있습니다. 그 방송의 주파수는 메모나 브라우저의 기록 001에 나와요.',
      },
    ],
  },

  // ── 3. 02호실 ──────────────────────────────────────────────────────────
  {
    id: 'album-open',
    on: 'album:unlock',
    actions: [
      { t: 'flag', f: 'album-open' },
      { t: 'objective', text: '숨김 앨범을 끝까지 넘겨 보자', hint: '사진을 연 뒤 옆으로 넘기세요. 마지막 사진까지.' },
    ],
  },
  {
    id: 'card',
    on: 'photo:h03',
    actions: [
      { t: 'flag', f: 'saw-card' },
      { t: 'wait', ms: 1600 },
      { t: 'msg', th: 'unknown', text: '채원 씨 카드예요. 당신 것도 곧 만들어져요.', typing: 1700 },
    ],
  },
  {
    id: 'selfie',
    on: 'photo:h05:dwell',
    actions: [
      { t: 'flag', f: 'selfie-scare' },
      { t: 'scare', kind: 'lunge' },
      { t: 'wait', ms: 1800 },
      { t: 'glitch', ms: 700 },
      { t: 'time', hm: '01:38', lost: true },
      { t: 'wait', ms: 2600 },
      { t: 'msg', th: 'self', from: 'me', text: '여기 너무 추워' },
      { t: 'objective', text: '누군가 이 폰으로 “나에게” 메시지를 보냈다', hint: '메시지 앱 → 나에게.' },
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
      { t: 'msg', th: 'self', from: 'me', text: '기록보관소 사이트 013번. 그 여자가 무서워하는 게 거기 있어', typing: 2600 },
      { t: 'msg', th: 'self', from: 'me', text: '라디오 숫자 순서대로 열어야 나와. 메모에 적어 놨어', typing: 2000 },
      { t: 'time', hm: '01:44' },
      {
        t: 'objective',
        text: '브라우저의 “심야 기록보관소”에서 기록 013을 찾자',
        hint: '메모 “괴담 정리”의 숫자 순서: 기록 001 → 003 → 007을 다른 기록을 섞지 않고 차례로 여세요.',
      },
      { t: 'wait', ms: 6000 },
      { t: 'msg', th: 'unknown', text: '채원 씨랑 얘기하지 마세요.', typing: 1200 },
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
    actions: [{ t: 'flag', f: 'found-key' }, { t: 'wait', ms: 2500 }, { t: 'emit', ev: 'ch4' }],
  },

  // ── 4. 두 시 전 ────────────────────────────────────────────────────────
  {
    id: 'ch4',
    on: 'ch4',
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
      { t: 'note', id: 'n4' },
      { t: 'msg', th: 'dohyun', text: '곧 두 시예요. 제발 그 폰 꺼요', typing: 800 },
      {
        t: 'objective',
        text: '02:00이 오기 전에 준비하자',
        hint: '02:00에 선택의 순간이 옵니다. 열쇠(HAEWON-0200)와 첫 근무자의 이름(브라우저 기록 003)을 기억해 두세요.',
      },
      { t: 'sound', id: 'heartbeat' },
      { t: 'countdown', from: '01:50', to: '01:59', stepMs: 10000 },
      { t: 'wait', ms: 5000 },
      { t: 'finale' },
    ],
  },
  { id: 'power-ch4', on: 'power:try', requires: ['ch4'], repeat: true, actions: [{ t: 'msg', th: 'unknown', text: '아직이에요.', typing: 700 }] },
  { id: 'radio', on: 'dial:1340', actions: [{ t: 'flag', f: 'heard-radio' }] },
  { id: 'read-mom', on: 'thread:mom', actions: [{ t: 'flag', f: 'read-mom' }] },
];
