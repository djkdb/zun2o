# 스토리 룸 — 실제로 플레이하며 검토하기

스토리 룸 에이전트가 소스 읽기 대신 **브라우저에서 직접 플레이**할 때 쓰는 안내입니다.

## 띄우기
- 빌드가 최신인지 확인: `git log -1`과 `dist/`의 수정 시각. 필요하면 `npm run build` (다른 에이전트가 동시에 플레이 중이면 빌드하지 말 것).
- 미리보기 서버: `bash scripts/.play-up.sh` → http://localhost:4173 (이미 떠 있으면 그대로 씀).
- 브라우저는 각자 따로 띄웁니다(9222 포트의 공용 크롬은 쓰지 않음):
  ```js
  import { chromium } from 'playwright-core';
  import { CHROMIUM } from '/home/user/zun2o/scripts/chromium.mjs';
  const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  ```
- 스크립트는 저장소 폴더에서 `node`로 실행하되, 파일은 스크래치패드(또는 `qa-output/`)에 둡니다. 넓은 `pkill -f`는 금지.
- 공용 기록기: `scripts/story-room/recorder.mjs`의 `launch(태그)` → `{ page, tap, app, thread, key, bannerTap, snap, dump, … }`. 100ms마다 보이는 변화(배너·입력 중·통화 자막·영상 자막·피날레 단계·플래그·새 문자)와 소리 시작을 실제 시각과 함께 `window.__L`에 남깁니다. `ROUND=round4`면 스크린샷이 `qa-output/story-room/round4/`에 갑니다.
  - 읽기: `node scripts/story-room/timeline.mjs 기록.json [--snd]`, 배너 수명: `node scripts/story-room/banners.mjs 기록.json`.

## 진행하는 법
- `http://localhost:4173/?debug=1` 로 열면 `window.__game` = `{ emit, getState, setSpeed, setSave, setRt }`.
- 기본은 사람처럼: 앱 아이콘(`.app-icon` + 이름), 대화(`.thread-row`), 선택지 텍스트, 키패드(`.keypad .key`), 홈(`.homebar`).
- 막히면 힌트 시트를 먼저 쓰고, 그래도 막히면 그때 `setSpeed`(최대 4)·`emit`을 쓰고 보고서에 적습니다. 정답·셀렉터 예시는 `scripts/playtest.mjs`, `scripts/playtest2.mjs`에 있지만 미리 보면 첫 관객이 아닙니다.
- 소리: 음성 파일은 실제로 재생됩니다. 듣지는 못하지만 자막(`.video-sub`, 통화 자막)과 재생 길이로 확인할 수 있습니다.
- 스크린샷은 `qa-output/story-room/<라운드>/<역할>-NN-설명.png`.
- 콘솔 오류는 `page.on('console')`, `page.on('pageerror')`로 모읍니다.

## 시간
- 시즌 1은 사람 속도로 약 25분, 시즌 2는 약 18분. 대기가 긴 구간만 배속.

## 함정 (3라운드에서 겪은 것)
- `__game.setRt({ thread: … })`로 대화를 열면 `thread:*` 이벤트가 나지 않아 선택지·반응이 안 뜹니다. 대화는 화면을 눌러 여세요(`.thread-row`).
- 여러 에이전트가 동시에 플레이하면 스크래치패드의 같은 파일 이름을 덮어씁니다. 스크립트는 `scratchpad/<역할>/` 아래에 두세요.
- 디버그 점프(CH3 등)는 건너뛴 beat를 끝난 것으로 표시하지 않습니다. 예: 재부팅 뒤 잠금 해제 때 1장 카드가 다시 뜸. 실제 결함과 구분해 적으세요.
- 배너는 최소 2.4초 떠 있고, 그사이 온 것은 대기열에서 차례를 기다립니다. "배너가 늦게 뜬다"는 대기열 때문일 수 있습니다(기록의 배너 시각으로 확인).
- 녹음이 아직 없는 줄(새로 쓴 대사)은 시즌 1에선 기기 음성, 헤드리스 브라우저에선 무음입니다. `docs/VOICE_LINES.md`와 `src/assets/voice/`로 확인하세요.
