귀신 관련 효과음 녹음본 (ElevenLabs sound effects, `npm run sfx`, 설명문은 `scripts/sfx.mjs`).
속삭임·비명·서랍·노크·숨소리·발소리·위층 발소리·문 삐걱임·물방울·숨 들이켬·심장 박동.
파일이 있는 소리는 녹음본을, 없는 소리는 지금처럼 합성음을 재생한다. 언제 나는지는 그대로다.

`whisper.mp3`만은 생성하지 않았다. 생성한 속삭임이 영어 단어("No mercy")로 들렸기 때문.
대신 서미령 대사 28·24번 녹음을 거꾸로 돌리고 낮추고 숨소리처럼 깎아 만들었다(알아들을 수 없는, 같은 사람의 목소리):
`ffmpeg -i voice-raw/28.mp3 -i voice-raw/24.mp3 -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1,areverse,asetrate=44100*0.9,aresample=44100,atempo=1.08,highpass=f=900,lowpass=f=6500,volume=0.8,aecho=0.8:0.6:60|140:0.3|0.18,afade=t=in:d=0.25,loudnorm=I=-24:TP=-3" -ac 1 -b:a 96k whisper.mp3`
