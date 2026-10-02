통화·녹음·영상통화 대사 음성. 대사 목록과 번호는 `docs/VOICE_LINES.md`.

- 도현(male), 채원(female): ElevenLabs `eleven_v3`, 기본 목소리 Liam / Jessica, 대사마다 연기 지시 태그
  (`scripts/voices.mjs`의 DIRECTION). `npm run voices:eleven`.
- 서미령(entity): ElevenLabs 웹에서 Shin rara로 만든 파일을 `voice-raw/<번호>.mp3`로 넣고 `npm run voices:fx`.
  파일이 없는 대사는 브라우저 음성으로 읽힌다.
- 모든 파일은 `voices:fx`가 장면에 맞게 처리: 통화는 전화선 음질, 녹음은 폰 마이크 + 열람실 울림,
  서미령은 조금 낮고 멀게, 공통으로 옅은 잡음.

파일 이름은 대사 내용의 해시라, 대사를 고치면 그 줄만 다시 만들면 된다.
음성 생성: ElevenLabs (elevenlabs.io).
