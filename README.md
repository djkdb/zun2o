# THE NIGHT ARCHIVE

> 새벽 2시에 이 사이트를 열면 안 된다.

처음에는 1990년대 지방 기록보관소의 오래된 홈페이지처럼 보이는 **인터랙티브 아날로그 호러 / ARG 웹 경험**입니다.
오래 머물수록, 다시 방문할수록, 그리고 **사용자 로컬 시간**이 새벽 2시에 가까워질수록 사이트의 규칙이 조금씩 무너집니다.

- 01:30 이전 — 완전히 평범함 (아주 드물게 "버그 같은" 현상 하나)
- 01:30 ~ 01:45 — 미세한 이상현상
- 01:45 ~ 01:55 — 행동과 연결된 이상현상 증가
- 01:55 ~ 01:59 — 레이아웃이 서서히 깨짐
- 01:59 — 60초 동안 화면이 어두워지고 시계가 커짐
- **02:00:00 — MAIN EVENT (약 32초 다단계 연출)**
- 02:00 ~ 02:59 — 사이트가 완전히 다른 곳(UNKNOWN)이 됨
- 03:00 이후 — 조용해지지만, 사이트는 당신을 기억함

그리고 **그녀**가 있습니다. 처음엔 사진 속 문간의 작은 그림자였다가, 방문할수록 가까워지고, 새벽이 되면 화면 밖으로 나옵니다 (점프스케어).

외부 이미지·음원은 하나도 없습니다. 사진은 전부 SVG로 그렸고, 모든 소리는 Web Audio API로 실시간 합성합니다.

## 귀신 / 점프스케어

점프스케어는 무작위로 터지지 않습니다. 전부 **사이트가 이미 이상해진 뒤(레벨 2~3 이상)**, **사용자가 한 행동**에 반응합니다. 낮의 첫 방문에서는 절대 나오지 않습니다.

| 종류 | 조건 | 연출 |
|---|---|---|
| 02:00 클라이맥스 | 메인 이벤트 27.4초 — 사진 속 인물이 카메라를 본 직후 | 사진에서 튀어나와 화면으로 돌진 + 비명 |
| Tape 6 | 레벨 3+에서 Record 006(녹음 전사)을 끝까지 읽음 ("마이크 바로 앞의 숨소리") | 돌진 + 비명 |
| Annex | 레벨 4+에서 Record 005를 끝까지 읽음 | 돌진 + 비명 |
| 이름 부르기 | 레벨 4+에서 검색창에 `varga` / 터미널에서 `varga` 입력(레벨 2+) | "SHE IS BUSY." → 돌진 |
| 응시 | 레벨 3+에서 45초 동안 가만히 있음 | 속삭임 → 화면 중앙에 얼굴이 천천히 떠오름 → 3.6초 후 돌진 |
| 엿보기 | 레벨 3+ 앰비언트 (세션당 최대 2회) | 화면 오른쪽 가장자리에 얼굴 반쪽, 0.8초 |
| 반사 | 레벨 2+ 화면 암전 이상현상 | 0.16초 암전 속에 희미한 얼굴 |

- 같은 얼굴이 레코드 003 사진, Annex 창문 속에 먼저 작게 등장합니다 (예고 → 회수).
- 비명은 Web Audio로 합성합니다 (디스토션 톤 + 노이즈 + 저음 타격). 사운드는 첫 클릭 이후에만 켜집니다.
- **Reduce effects / prefers-reduced-motion**에서는 스트로브·확대·흔들림 없이 얼굴이 나타났다 사라지는 순한 버전으로 바뀝니다. 흰색 플래시는 사용하지 않습니다.
- 디버그 패널: `Jump scare`, `Stare`, `Peek` 버튼으로 바로 확인할 수 있습니다.

---

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ 생성 (tsc -b + vite build)
npm run preview    # 빌드 결과 확인 (http://localhost:4173)
npm run lint
npm run typecheck
npm test           # 엔진 단위 테스트 (vitest)
npm run qa         # E2E QA (preview 서버가 떠 있어야 함, 아래 참고)
```

빌드는 `base: './'` + 해시 라우팅이라 GitHub Pages, Netlify, 어떤 정적 호스팅에 올려도 서버 설정 없이 동작합니다.
`.github/workflows/deploy.yml`이 포함되어 있어, 저장소 **Settings → Pages → Source: GitHub Actions**로 설정하면 `main` 푸시 시 자동 배포됩니다.

### Cloudflare 배포

순수 정적 사이트라(서버 코드 없음, 해시 라우팅) 리다이렉트 설정 없이 그대로 올라갑니다. Node 버전은 `.nvmrc`(22)로 고정되어 있습니다.

**방법 A — GitHub 연결 (자동 배포, 추천)**
1. Cloudflare 대시보드 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → 이 저장소 선택
2. Production branch: `main` (또는 작업 브랜치)
3. Framework preset: `Vite` (또는 None) · Build command: `npm run build` · Build output directory: `dist`
4. **Save and Deploy** → `https://<프로젝트명>.pages.dev` 발급. 이후 푸시할 때마다 자동 재배포, 다른 브랜치는 미리보기 URL 생성

**방법 B — CLI로 바로 배포**
```bash
npx wrangler login     # 브라우저로 Cloudflare 로그인 (최초 1회)
npm run deploy:cf      # 빌드 후 wrangler.jsonc 설정으로 업로드 → https://night-archive.<계정>.workers.dev
```

커스텀 도메인은 프로젝트 → **Custom domains**에서 연결합니다. GitHub Pages를 쓰지 않는다면 `.github/workflows/deploy.yml`은 지워도 됩니다.

---

## Debug Mode

URL에 `?debug=true`를 붙이면 (세션 동안 유지) 오른쪽 아래에 디버그 패널이 나타납니다. `?debug=false`로 끕니다.

- 표시: HORROR LEVEL / CURRENT TIME / VISIT COUNT / SESSION TIME / CLICKS / MAIN EVENT 단계 / 열어본 기록 / 기록 순서 / SECRET / FLAGS / ENDINGS / 발견한 이상현상 수 / 트리거 로그
- 버튼: `L0`~`L5` 강제, `auto`, `Jump scare` / `Stare` / `Peek`, 시간 점프(`12:00` `01:30` `01:45` `01:55` `01:59` `01:59:50` `02:03` `03:10` `real`), **Trigger 02:00**, Random anomaly, 특정 anomaly Fire, Unlock all, Reset save, 엔딩 테스트(normal/secret/true)
- 시작 시각 지정: `?debug=true&t=01:59:50` — 방문 기록 자체가 그 시각으로 저장되므로 촬영용으로 적합

프로덕션(쿼리 없음)에서는 패널이 렌더링되지 않습니다.

---

## 릴스 촬영 가이드 (9:16)

| Scene | URL / 행동 |
|---|---|
| 01 평범한 사이트 | `/#/` 첫 방문 (시크릿 창 권장) |
| 02 "어? 방금 뭐였지?" | Record #007에 여러 번 마우스 올리기 → `DO NOT OPEN`이 0.6초 보임. 또는 `?debug=true&t=01:47` 후 대기 |
| 03 01:59:59 | `?debug=true&t=01:59:50#/` → 패널 `—`로 접기 → 커진 시계, 어두워지는 화면 |
| 04 02:00 | 그대로 대기 → 시계 정지, 침묵, 제목이 `THE NIGHT ARCHIVES YOU`로 스크램블 |
| 05 사이트 전체 변화 | 메뉴가 하나씩 사라지고 화면이 꺼짐 → 기록이 스스로 타이핑되며 **당신의 행동을 회상** |
| 06 숨겨진 페이지 | 사진 속 인물이 카메라를 봄 → **그대로 화면으로 튀어나옴(점프스케어)** → 자동으로 Record 009(방문자 로그) 이동, 메뉴에 `UNKNOWN` |
| 07 예상하지 못한 메시지 | `#/record/003`의 마지막 문장 클릭 → `/system` 터미널 (`ACCESSING ARCHIVE... OPEN? [Y/N]`) |

각 이벤트는 시작/끝이 명확하도록 설계되었습니다 (02:00 연출 타임라인: `src/data/mainEvent.ts`).
Web Audio는 첫 클릭 이후에만 켜지므로, 촬영 전에 화면을 한 번 클릭해 두세요.

---

## 구조

```
src/
  game/                 ← 모든 판단은 여기서 (React 비의존)
    horrorEngine.ts     시간 + 행동 → HORROR LEVEL, 사진 단계, 레벨별 프로필
    eventManager.ts     이상현상 선택 규칙 (레벨/쿨다운/횟수/once/확률/선행조건/화면에 보이는지)
    secretManager.ts    기록 접근 규칙, Secret A 순서 판정
    endingManager.ts    엔딩 조건 평가
    search.ts           검색 (일반 결과 + 조건부 숨은 결과)
    store.ts            상태 저장소 (save + session), 모든 변경 액션
    director.ts         앱의 유일한 반복 타이머 (벽시계 초에 정렬된 1초 틱)
    clock.ts            가상 시계 (실제 로컬 시간 + 디버그 오프셋)
    save.ts             localStorage 스키마 v1, 검증/초기화
    template.ts         기록 텍스트 {placeholder} 치환
  data/                 ← 콘텐츠는 전부 데이터
    anomalies.ts        이상현상 48종 (점프스케어 6종 포함)
    records.ts          기록 001–009, 013 (레벨별 variants)
    secrets.ts endings.ts mainEvent.ts copy.ts
  components/           Ghost(그녀 + 점프스케어), Header, Navigation, Clock, RecordList, GlitchText, AnomalyOverlay,
                        AudioController, HorrorTransition(02:00), Terminal, DebugPanel, photos/…
  pages/                Index, Records, Record, Search, About, Contact, System, Room02, Unknown, Ending, NotFound
  hooks/                useGame(selector), useAnomaly(target), useLocalTime, useTypewriter, …
  utils/                audio(Web Audio 합성), storage(안전 래퍼), time, router, random
scripts/qa.mjs          Playwright E2E QA (90 checks)
```

### 이상현상 추가하기

`src/data/anomalies.ts`에 항목 하나를 추가하면 됩니다.

```ts
{
  id: 'clock-freeze', label: 'The seconds stop', category: 'time',
  target: 'clock', effect: 'freeze',
  minLevel: 1, maxLevel: 4,
  trigger: { kind: 'ambient' },                 // 또는 { kind: 'action', type: 'hover', match: 'record-007' }
  probability: 1, duration: 3500, cooldown: 120_000, maxTriggers: 3,
  once?: true, weight?: 2, intense?: true, requires?: { minVisits, flags, records, … }, sound?: 'anomaly',
}
```

`target`을 구독하는 컴포넌트(`useAnomaly('clock')`)가 `effect` 키를 해석합니다. 기존 effect를 재사용하면 컴포넌트 수정이 필요 없습니다.
스케줄러는 **현재 화면에 마운트된 target에만** 이상현상을 발생시키므로, 보이지 않는 곳에서 낭비되지 않습니다.

---

## 저장 데이터와 개인정보

- 모든 진행은 브라우저 `localStorage`(`night-archive:save`, `saveVersion: 1`)에만 저장됩니다. 서버 전송, 쿠키, 트래커, 외부 요청이 없습니다.
- 카메라·마이크·위치 권한을 요청하지 않습니다. "사이트가 당신을 기억하는" 효과는 전부 로컬 방문 기록으로 만듭니다.
- 손상된 저장 데이터는 필드 단위로 검증되고, 파싱 불가/버전 불일치 시 안전하게 초기화됩니다.
- localStorage가 막힌 환경(시크릿 모드 등)에서는 메모리로 대체되어 탭을 닫을 때까지 플레이할 수 있습니다.
- About 페이지에서 로컬 데이터를 직접 지울 수 있습니다.

## 접근성

- 키보드 탐색, focus-visible, skip link, aria-label, 44px 터치 영역
- 사운드 OFF 상태에서도 전체 진행 가능 (소리는 연출 보조일 뿐 단서가 아님)
- `prefers-reduced-motion` 또는 푸터의 **Reduce effects** 토글 → 깜빡임/흔들림 계열(`intense`) 이상현상 제외, 애니메이션 정지, 타이핑 즉시 표시
- 02:00 연출은 SKIP 버튼으로 건너뛸 수 있음

---

<details>
<summary><strong>스포일러: Secret Path와 엔딩</strong></summary>

**Secret A — The Broadcast Order**
Record 001의 라디오 운영자가 들은 숫자: *001, 003, 007, 13*. 이 순서로 기록을 열면(007은 001·003을 먼저 봐야 열림) Record 013이 색인에 추가됩니다. 013을 열면 완료. 013에는 터미널용 키 `HARROW-0200`이 있습니다.

**Secret B — Her Last Sentence**
Record 003의 마지막 문장 *"The index is longer at night."* 을 클릭 → `/system` 터미널 해금 → `OPEN? [Y/N]` (N을 눌러도 파일은 열립니다) → LAST_ENTRY.TXT.

**Secret C — The Visitor Log**
Record 009는 02:00–02:59에만 열립니다. 02:00 이벤트를 목격하면 자동으로 이동합니다. 당신의 실제 방문 시각 목록이 나옵니다.

**Secret D — ROOM_02**
레벨 2 이상에서 검색창에 `room` → `ROOM_02 [FILE CORRUPTED]` → 봉인된 방.

**엔딩**
1. **CHECKED OUT (Normal)** — Contact의 Check out, 02:00 이후 Record 017에서 Leave, 또는 터미널 `LOGOUT`
2. **THE INDEX (Secret)** — A+B 완료 후 터미널에 `key HARROW-0200`
3. **NIGHT SHIFT (True)** — A+B+C 완료 후 **02:00–02:59에** `#/unknown`(Record 017)에서 *Accept the shift*. 이후 사이트는 영원히 조용해지고, 당신을 "archivist"라고 부릅니다.

그 외: 404 페이지의 흰 글씨(드래그), 탭을 떠나면 바뀌는 제목, 레벨마다 바뀌는 기록 문장, 방문할 때마다 다가오는 사진 속 인물.
</details>
