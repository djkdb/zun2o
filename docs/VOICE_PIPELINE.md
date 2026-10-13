# 음성 자동 생성 (ElevenLabs)

키는 저장소에 넣지 않습니다. 클라우드 환경 설정의 환경 변수 `ELEVEN_API_KEY`로만 받습니다. 새 세션부터 읽힙니다.

## 왜 부자연스러웠나

- 시즌 1의 도현과 채원은 ElevenLabs 기본 **영어** 목소리(Liam, Jessica)로 한국어를 읽혔습니다. 억양이 어색한 가장 큰 원인입니다.
- "3층", "1시 58분", "제2서고"처럼 숫자를 그대로 보내면 읽는 방식이 흔들립니다. 지금은 `src/audio/sayKo.ts`가 사람이 읽는 대로 한글로 바꿔서 보냅니다(삼 층, 한 시 오십팔 분, 제이 서고). 게임 자막은 그대로입니다.

## 순서

1. **`npm run voices:audition`** — 역할마다 보이스 라이브러리에서 한국어 목소리 후보 12개씩 고릅니다.
   - 역할: 도현, 채원, 서미령, 엄마, 소연.
   - 결과는 `voice-takes/audition.html`에 미리듣기와 함께 정리됩니다. 크레딧을 쓰지 않고, 계정도 바꾸지 않습니다.
2. 고른 목소리를 계정에 추가합니다: `ADOPT=<owner id>:<voice id>,… npm run voices:adopt`. 이미 계정에 있는 목소리는 생략합니다.
3. 역할별 목소리 id를 환경 변수로 지정합니다: `ELEVEN_VOICE_MALE`, `_FEMALE`, `_ENTITY`, `_MOTHER`, `_SOYEON`.
4. **`npm run voices:auto`** — 대사마다 여러 번 뽑아 자동 채점합니다.
   - 기본 3번이고 `ELEVEN_TAKES`로 바꿉니다. `eleven_v3` 모델에 연기 지시 태그를 붙이고, 3번 중 1번은 더 과감하게(stability 0) 뽑습니다.
   - 채점 기준:
     - **받아쓰기(scribe)로 되돌려 대사와 비교:** 틀리거나 빠진 글자 비율(CER)이 가장 무겁습니다.
     - 말 속도: 초당 음절 수. 속삭임과 느린 대사는 기준을 따로 둡니다.
     - 클리핑, 이유 없는 중간 공백.
     - 태그를 소리 내 읽어 버린 경우(받아쓰기에 영어가 섞임).
   - 1위는 `voice-raw/NN.mp3`로 가고, `voices:fx`가 통화·녹음·테이프 효과를 입혀 `src/assets/voice`에 넣습니다.
   - CER이 0.15를 넘으면 `⚠ check`로 표시합니다.
   - 일부만 할 때: `ONLY=33-55`(시즌 2만) 또는 `ONLY=11,22`.
5. **사람이 듣고 고르기:** `voice-takes/index.html`에 대사마다 1·2위가 나란히 있습니다. 1위가 아닌 쪽을 고른 결과를 `npm run voices:pick -- 33:2,40:1`로 반영합니다. 감정이 맞는지는 기계가 판단하지 못합니다.

## 비용

대사 55줄(시즌 1 32줄, 시즌 2 23줄)을 3번씩 뽑으면 음성 생성 165번과 받아쓰기 165번입니다. 시즌 2만 하면 69번씩입니다.

## 타입캐스트 (한국어 원어민 목소리)

ElevenLabs 무료 플랜은 한국어 라이브러리 목소리와 Voice Design을 API로 쓸 수 없습니다. 그래서 한국어는 타입캐스트(SSFM 3.0)로 뽑습니다. 무료 API는 월 15,000자이고, 상업적으로 쓸 수 없으며 출처 표기가 필요합니다.

- 키는 환경 변수 `TYPECAST_API_KEY`에 넣고, 역할별 목소리는 `TYPECAST_VOICE_MALE` · `_FEMALE` · `_ENTITY` · `_MOTHER` · `_SOYEON`(`tc_…`)에 넣습니다. `_MOTHER`를 비우면 `_ENTITY`를 씁니다.
- `TTS=typecast npm run voices:auto`: 대사마다 3번 뽑습니다.
  - 1번째는 앞뒤 대사를 함께 보내 문맥으로 감정을 정하는 smart 감정입니다.
  - 2·3번째는 연기 지시 태그를 프리셋에 맞춰 강도 1.2와 1.6으로 뽑습니다. 프리셋은 whisper, sad, toneup, happy, tonedown, normal 중 하나입니다.
  - `TYPECAST_STYLE=smart` 또는 `preset`으로 하나만 쓰게 할 수 있습니다. `auto`로 두면 속삭이는 줄만 whisper 프리셋을 쓰고 나머지는 smart로 뽑습니다.
- **무료 계정은 천천히:** 요청 사이에 기본 15초를 쉽니다(`TC_DELAY_MS`). 429가 오면 30초, 60초, 90초 기다리고, 403(이상 활동 감지)이 오면 바로 멈춥니다. 다 만든 테이크는 남아 있어서 다시 실행하면 이어서 합니다. 오디션 때 32개를 몰아서 요청했더니 무료 계정이 이상 활동으로 막혔습니다.
- 채점과 듣기 페이지, `voices:pick`은 ElevenLabs와 같습니다. 받아쓰기 채점에는 `ELEVEN_API_KEY`가 있어야 하며, 무료 플랜으로 충분합니다.

## VoxCPM2 (로컬, 무료, 상업적 사용 가능)

OpenBMB의 VoxCPM2(2B, 한국어 포함 30개 언어, Apache-2.0)를 이 컴퓨터에서 직접 돌립니다. API 키도 계정도 필요 없고, 만든 음성은 상업적으로 써도 됩니다. GPU가 없어도 되며, CPU 4코어에서 대사 3초에 약 20초가 걸립니다.

1. 설치: `pip install voxcpm` (torch 2.5 이상). 모델은 처음 실행할 때 받거나, 미리 받아 둔 폴더를 `VOXCPM_MODEL`로 지정합니다(약 5GB).
2. **`npm run voices:cast`** — 역할마다 설명(나이, 성별, 말투)으로 목소리를 3개씩 디자인합니다. `voice-takes/voxcpm/cast/index.html`에서 듣고 고릅니다.
3. **`CAST=male:2,female:2,entity:3,soyeon:2 npm run voices:cast`** — 고른 목소리를 `voice-refs/<역할>.wav`로 저장합니다. 이 파일이 그 인물의 목소리가 됩니다. 엄마(시즌 2)는 서미령의 목소리를 따뜻한 말투로 씁니다.
4. **`TTS=voxcpm npm run voices:auto`** — 대사마다 2번(`TAKES`) 뽑습니다. 연기 지시 태그(`[whispers] [slowly]`)는 "(whispering, slowly)" 같은 말투 지시로 바뀌어 함께 들어가고, 목소리는 `voice-refs`를 따라 합니다. 채점과 듣기 페이지(`voice-takes/voxcpm/index.html`), `voices:pick`은 위와 같습니다.

`VOXCPM_PY`에는 voxcpm을 설치한 파이썬을 지정합니다(기본 `python3`).
