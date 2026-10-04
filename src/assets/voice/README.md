통화·녹음·영상통화 대사 음성. 대사 목록과 번호는 `docs/VOICE_LINES.md`.

- 도현(male), 채원(female): ElevenLabs `eleven_v3`, 기본 목소리 Liam / Jessica, 대사마다 연기 지시 태그
  (`scripts/voices.mjs`의 DIRECTION). `npm run voices:eleven`.
- 서미령(entity): ElevenLabs 웹에서 Shin rara(eleven_v3)로 16줄을 한 파일에 생성 → 음성 인식(scribe)의
  단어 시각으로 줄마다 잘라 `voice-raw/<번호>.mp3` → `npm run voices:fx`.
  파일이 없는 대사는 브라우저 음성으로 읽힌다.
- 모든 파일은 `voices:fx`가 장면에 맞게 처리: 통화는 전화선 음질, 녹음은 폰 마이크 + 열람실 울림,
  서미령은 조금 낮고 멀게, 공통으로 옅은 잡음.

파일 이름은 대사 내용의 해시라, 대사를 고치면 그 줄만 다시 만들면 된다.
음성 생성: ElevenLabs (elevenlabs.io).

시즌 2(엄마·소연, `docs/VOICE_LINES.md` 33~55번)는 아직 녹음이 없습니다. 그동안 게임은 이 대사들을 브라우저 음성으로 읽지 않고 자막만 보여 줍니다.
엄마의 줄 중 시즌 1에 이미 녹음된 말("앉으세요. 두 시에 이름을 적어요.", "다 적어 뒀어요.")은 서미령의 녹음으로 나옵니다.
만들 때는 키를 저장소에 넣지 말고 환경 변수로만:
`ELEVEN_API_KEY=… ELEVEN_VOICE_ENTITY=<Shin rara id> ELEVEN_VOICE_SOYEON=<43세 여성 목소리 id> npm run voices:eleven`
(엄마는 `ELEVEN_VOICE_MOTHER`를 비우면 서미령과 같은 목소리로, 귀신 처리 없이 통화·녹음 음질만 입힙니다.)
