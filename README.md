# 새벽 2시의 휴대폰

> 폐쇄된 해원군청 별관 앞 공중전화 부스. 선반 위에 휴대폰 한 대가 놓여 있다. 배터리 12%.

**주운 휴대폰 호러 게임**입니다 (Simulacra, Sara Is Missing 계열). 화면 전체가 실종된 폐건물 유튜버 **윤채원**의 휴대폰입니다.
잠금을 풀고, 메시지·사진·녹음·통화·브라우저를 뒤져 그날 밤 무슨 일이 있었는지 알아내세요.
정체불명의 번호 **“02:00”** 이 실시간으로 말을 걸고, 폰 속 시계는 새벽 2시를 향해 갑니다.

- 플레이 시간 15–20분 · 챕터 5개 · 엔딩 3개 · 이어폰 권장
- **실제 시간과 상관없이 언제든** 플레이할 수 있습니다. (진짜 새벽 2시에 끝까지 가면 대사 한 줄이 더 나옵니다)
- 휴대폰에서 **“홈 화면에 추가”** 하면 앱처럼 전체 화면으로 설치됩니다 (PWA, 오프라인 동작).
- 외부 이미지·음원 없음: 사진은 SVG로 그렸고, 소리는 Web Audio로 합성, 목소리는 브라우저 음성 합성 + 자막. “그녀”의 목소리는 음절마다 합성한 숨소리를 입힙니다.

## 게임 흐름 (스포일러 약간)

| 챕터 | 폰 시계 | 내용 |
|---|---|---|
| 0 잠금 | 23:51 | 잠금 화면 알림과 배경 사진에서 암호를 찾는다 |
| 1 채원의 폰 | 23:52 | 모르는 번호가 말을 건다 → 마지막 사진을 밝게 보정하면… |
| 2 목소리 | 00:47 | 도현의 전화 → 채원의 마지막 녹음 → “당신 이름은 뭐예요?” |
| 3 02호실 | 01:12 | 숨김 앨범 → 셀카 → 이 폰으로 “나에게” 메시지가 온다 |
| 4 두 시 전 | 01:50 | 스스로 설치되는 앱, 지워지는 메시지, 꺼지지 않는 전원 |
| 5 02:00 | 02:00 | 시계 정지, 알림 폭주, 영상 통화, 그리고 선택 |

공포 연출은 전부 **플레이어의 행동이 방아쇠**입니다: 사진 밝기를 직접 올리거나, 셀카를 넘기거나, 녹음을 끝까지 듣거나.
그 사이사이에는 어두운 홈 화면에 얼굴이 비치는 순간, 아무도 적지 않은 일정이 캘린더 위젯에 생기는 순간 같은 작은 이상현상이 끼어 있습니다.
막히면 80초쯤 뒤 등장인물이 문자로 슬쩍 알려 주고, 100초 넘게 막히면 오른쪽 위에 **`? 막혔나요`** 가 떠서 지금 할 일과 힌트를 보여 줍니다.
사진은 **두 번 탭하면 확대**됩니다. 작게 찍힌 것을 놓치지 마세요.

## 실행

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/ (타입체크 + 빌드 + PWA 서비스워커)
npm run preview      # http://localhost:4173
npm run lint
npm run typecheck
npm test             # 스토리 스크립트 무결성 테스트
npm run qa           # 자동 플레이 봇 (preview 서버가 떠 있어야 함)
```

### 배포

정적 사이트라 어디든 올라갑니다 (`base: './'`).
- **Cloudflare**: Workers & Pages → Create → Pages → Connect to Git → Build `npm run build`, Output `dist` (Node 22는 `.nvmrc`로 고정). 또는 `npx wrangler login && npm run deploy:cf`.
- **GitHub Pages**: `.github/workflows/deploy.yml` 포함 (Settings → Pages → Source: GitHub Actions).

## 디버그 / 촬영

`?debug=1` → 왼쪽 가장자리 **DBG** 버튼: 챕터 점프(CH1–CH4, 02:00), ×6 빨리감기, 새 게임, 귀신 모습별 스케어 미리보기(hang·profile·face·curtain).
`?debug=1&speed=4` 는 대화·대기 시간을 4배 빠르게 합니다 (점프스케어·연출 길이는 그대로).

릴스용 추천 장면: 잠금 화면 알림(0:10) · 사진 밝기 올리기 점프스케어 · 도현의 전화 마지막 “끄지 마세요” · 셀카 점프스케어 · 02:00 영상 통화.

## 구조

```
src/
  engine/     types, state(저장+런타임), director(비트 실행기), storage
  content/    script.ts(스토리 전체가 데이터), threads, media(사진·메모·녹음), calls, archive(폰 속 브라우저)
  phone/      PhoneShell, LockScreen, HomeScreen, CalendarWidget, Overlays(알림·통화·챕터·점프스케어·힌트), Finale, Ending, ColdOpen
  phone/apps/ Messages, Gallery, Notes, Memos, Browser, PhoneApp, Settings, IndexApp
  art/        Ghost(그녀), scenes(건물·열람실·평면도…), phonePhotos(폰 카메라 사진·영상 통화)
  audio/      engine(합성 효과음·벨소리·심장박동), speech(음성 합성)
scripts/      playtest.mjs(자동 플레이 봇), icons.mjs(PWA 아이콘 생성)
```

스토리 수정은 `src/content/script.ts`만 고치면 됩니다. 비트 하나는 `이벤트 → 액션 목록`입니다:

```ts
{ id: 'memo-end', on: 'memo:m1:end', actions: [
  { t: 'msg', th: 'unknown', text: '당신 이름은 뭐예요?', typing: 1800 },
  { t: 'choice', th: 'unknown', id: 'c2', options: [{ id: 'name', label: '이름을 알려 준다', input: 'name' }, …] },
]}
```

진행 상황은 브라우저 localStorage에만 저장되고, 대화 도중 새로고침해도 이어서 진행됩니다.

## 개인정보 · 접근성

- 이름과 진행 기록은 **이 기기에만** 저장되며 어디로도 전송되지 않습니다. 카메라·마이크·위치를 사용하지 않습니다. 전화 앱은 가짜이며 실제 전화를 걸지 않습니다.
- 설정 앱 → **효과 줄이기**: 번쩍임·진동·흔들림 없이 순한 버전으로 진행. `prefers-reduced-motion`도 존중합니다.
- 소리를 꺼도 자막으로 전부 진행할 수 있습니다.

<details>
<summary><strong>공략 (스포일러)</strong></summary>

- 잠금: `0113` (채원이 건물에 들어간 시각)
- 숨김 앨범: `1340` (해원방송 주파수 — 메모 “괴담 정리”, 기록 001. 3장 전에 풀면 “동기화 중”으로 기다림)
- 브라우저 “심야 기록보관소”에서 기록 001 → 003 → 007을 순서대로 열면 013이 나타남 → 열쇠 `HAEWON-0200`
- 02:00: **전원을 끈다**(엔딩 1) · **내가 남는다**(엔딩 2) · **열쇠 + 첫 근무자의 이름 `서미령`**(엔딩 3, 진엔딩)
- 숨은 것: 전화 앱에서 `1340`, `0200`에 걸어 보기 · 엄마의 메시지를 읽었는지에 따라 달라지는 대사
</details>
