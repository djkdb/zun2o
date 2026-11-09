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

## 진행하는 법
- `http://localhost:4173/?debug=1` 로 열면 `window.__game` = `{ emit, getState, setSpeed, setSave, setRt }`.
- 기본은 사람처럼: 앱 아이콘(`.app-icon` + 이름), 대화(`.thread-row`), 선택지 텍스트, 키패드(`.keypad .key`), 홈(`.homebar`).
- 막히면 힌트 시트를 먼저 쓰고, 그래도 막히면 그때 `setSpeed`(최대 4)·`emit`을 쓰고 보고서에 적습니다. 정답·셀렉터 예시는 `scripts/playtest.mjs`, `scripts/playtest2.mjs`에 있지만 미리 보면 첫 관객이 아닙니다.
- 소리: 음성 파일은 실제로 재생됩니다. 듣지는 못하지만 자막(`.video-sub`, 통화 자막)과 재생 길이로 확인할 수 있습니다.
- 스크린샷은 `qa-output/story-room/<라운드>/<역할>-NN-설명.png`.
- 콘솔 오류는 `page.on('console')`, `page.on('pageerror')`로 모읍니다.

## 시간
- 시즌 1은 사람 속도로 약 25분, 시즌 2는 약 18분. 대기가 긴 구간만 배속.
