// The spoken lines, as audio files. Made once, at authoring time; the game only
// plays the files it ships with (src/assets/voice) and never calls a TTS service.
//
//   npm run voices:list     numbered list of every spoken line → docs/VOICE_LINES.md
//   npm run voices:eleven   ElevenLabs (v3, with per-line delivery tags) → voice-raw/NN.mp3 → effects
//                           (ELEVEN_API_KEY=…, ELEVEN_VOICE_MALE / _FEMALE / _ENTITY=<voice id>)
//   npm run voices          Fish Audio → voice-raw/NN.mp3 → effects → src/assets/voice
//                           (FISH_API_KEY=… required; keys never go into the repo)
//   npm run voices:fx       effects only: voice-raw/NN.<mp3|wav|m4a|…> → src/assets/voice
//
// Any other TTS tool or a real recording works too: save each line as
// voice-raw/<number>.<ext> (numbers from docs/VOICE_LINES.md) and run voices:fx.
// The effects need `ffmpeg` on PATH.
//
// Env: FISH_VOICE_MALE / _FEMALE / _ENTITY override the voices below, FISH_MODEL
// (default s1), FORCE=1 to remake existing files, DRY=1 to only print.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { CALLS, VIDEO_CALL_LINES } from '../src/content/calls.ts';
import { MEMO_M1 } from '../src/content/media.ts';
import { spokenText, voiceKey } from '../src/audio/voiceKey.ts';

const OUT = 'src/assets/voice';
const RAW = 'voice-raw';
const KEY = process.env.FISH_API_KEY;
const MODEL = process.env.FISH_MODEL ?? 's1';
// Defaults picked by the author on fish.audio (voice ids are not secrets; the API key is):
//   male   = 도현  → 릴서 (20대 남성)          female = 채원 → 하은 Haeun (친근한 대화체)
//   entity = 서미령 → Yuna (또렷하고 차분한 안내 목소리)
const VOICES = {
  male: process.env.FISH_VOICE_MALE ?? '3c98ea364b634081a8e505def04edd9a',
  female: process.env.FISH_VOICE_FEMALE ?? '8f3cc2e594cf4a96a5049cb538f1b6d6',
  entity: process.env.FISH_VOICE_ENTITY ?? '3d31499f0e13438bbce8dcce7b7c4298',
};
// ElevenLabs v3 reads these audio tags as delivery directions; they are sent to the
// service only — the game's subtitles and file names use the plain line.
const DIRECTION = {
  '들려요?': '[whispers] [slowly]',
  '문은 열어 뒀어요.': '[calm] [softly]',
  '채원 씨도 어젯밤 이 전화를 받았어요.': '[calm] [softly] [slowly]',
  '여보세요? 채원아?': '[anxious] [breathing heavily]',
  '채원이야? 말 좀 해 봐.': '[desperate]',
  '학교 앞 전화부스에서 주운 거죠? 지금 전화부스 안이에요? 문 열려요?': '[nervous] [fast]',
  '채원이 녹음 앱 켜 놓고 들어갔어요. 마지막 녹음이 클라우드에 올라와 있어요. 보내 드릴게요.': '[shaky voice]',
  '경찰은 장난이래요. 근데 그 녹음 들어 보면 알 거예요.': '[frustrated] [quietly]',
  '두 시 전에는 그 폰 꺼요. 꼭이요. 두 시 전에': '[urgent] [panicked]',
  '끄지 마세요.': '[whispers] [cold]',
  '들려요? 저 제2서고 안이에요.': '[whispers] [terrified] [breathing heavily]',
  '서랍이 끝이 없어요. 채원이 목소리가 계속 저 안쪽에서': '[terrified] [shaky voice]',
  '도현 씨 목소리, 비슷했죠? 도현 씨도 이제 안에 있어요.': '[calm] [softly] [slowly]',
  '공공일.': '[monotone] [slowly]',
  '공공삼.': '[monotone] [slowly]',
  '공공칠.': '[monotone] [slowly]',
  '일삼.': '[monotone] [slowly]',
  '방문자, 공공이칠.': '[monotone] [slowly]',
  '지금 몇 시예요?': '[whispers]',
  '아직이네요.': '[softly] [sighs]',
  '주운 폰이 또 울려. 또 그 번호야.': '[nervous] [whispers]',
  '지금 3층이고요. 불 켜진 방이 열람실이에요.': '[whispers] [nervous]',
  '거기 누구 있어요?': '[scared] [whispers]',
  '방문자세요?': '[whispers] [calm]',
  '네?': '[scared] [gasps]',
  '앉으세요. 두 시에 이름을 적어요.': '[calm] [softly] [slowly]',
  '도현아': '[crying] [terrified]',
  '다 적어 뒀어요.': '[whispers] [slowly]',
  '이름은 몰라도 괜찮아요. 두 시에 봐요.': '[softly] [slowly]',
  '들려?': '[whispers] [scared]',
  '여기 너무 어두워. 서랍 소리가 멈추질 않아': '[scared] [shaky voice]',
  '잠깐. 네 카메라 네 뒤에도': '[terrified] [gasps]',
};

const WHO = { male: '도현', female: '채원', entity: '서미령 (발신자 정보 없음)' };

// Every line the game speaks, with its voice and where it is heard (keep in step
// with the speak() calls in Overlays, Memos and Finale). Where decides the effect.
const lines = [];
for (const call of Object.values(CALLS))
  for (const l of [...call.lines, ...(call.after ?? [])]) if (l.voice && l.who !== 'sfx') lines.push({ text: l.text, voice: l.voice, where: 'call' });
for (const l of MEMO_M1.lines) {
  if (l.who === '채원') lines.push({ text: l.text, voice: 'female', where: 'memo' });
  if (l.who === '???') lines.push({ text: l.text, voice: 'entity', where: 'memo' });
}
// 새녹음 18: its two fixed lines (the one with the player's name can't be prerecorded)
for (const text of ['다 적어 뒀어요.', '이름은 몰라도 괜찮아요. 두 시에 봐요.']) lines.push({ text, voice: 'entity', where: 'memo' });
for (const text of VIDEO_CALL_LINES) lines.push({ text, voice: 'female', where: 'video' });

const todo = [...new Map(lines.filter((l) => spokenText(l.text)).map((l) => [voiceKey(l.text, l.voice), l])).values()].map((l, i) => ({
  ...l,
  n: String(i + 1).padStart(2, '0'),
  key: voiceKey(l.text, l.voice),
  say: spokenText(l.text),
}));

// How each line should sound in the game. 도현 and her calls come down a phone
// line; 채원's memo was recorded on a phone in a big room; the video call is a
// little cleaner. Her voice is a touch lower and further away, with the room around it.
const PHONE = 'highpass=f=320,lowpass=f=3300,acompressor=threshold=-20dB:ratio=4:attack=5:release=80,volume=1.6';
const MEMO = 'highpass=f=110,lowpass=f=7200,aecho=0.8:0.55:45|110:0.18|0.10';
const VIDEO = 'highpass=f=180,lowpass=f=5200,acompressor=threshold=-18dB:ratio=3';
const LOWER = 'asetrate=44100*0.94,aresample=44100,atempo=1.0638';
const ROOM = 'aecho=0.8:0.7:70|190|340:0.28|0.16|0.08';
const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse';
function chain(l) {
  const her = l.voice === 'entity';
  const fx = l.where === 'call' ? PHONE : l.where === 'memo' ? MEMO : VIDEO;
  const noise = l.where === 'video' ? 0.002 : 0.005;
  const voice = [TRIM, 'aresample=44100', her ? LOWER : null, fx, her ? ROOM : null, 'loudnorm=I=-18:TP=-2:LRA=9'].filter(Boolean).join(',');
  // a bed of line noise under every line, so it never sounds like a studio
  return `[0:a]${voice}[v];anoisesrc=color=pink:amplitude=${noise}:sample_rate=44100[n];[v][n]amix=inputs=2:duration=first:weights=1 1[o]`;
}

function list() {
  const rows = todo.map((l) => `| ${l.n} | ${WHO[l.voice]} | ${l.where === 'call' ? '통화' : l.where === 'memo' ? '녹음' : '영상통화'} | ${l.say} |`);
  writeFileSync(
    'docs/VOICE_LINES.md',
    `# 음성 대사 목록\n\n\`npm run voices:list\`가 만든 파일입니다. 대사를 바꾸면 다시 실행하세요.\n\n` +
      `한 줄에 파일 하나: \`voice-raw/<번호>.mp3\` (wav·m4a도 됨)로 저장하고 \`npm run voices:fx\`를 실행하면\n` +
      `통화 음질·녹음실 울림·서미령 목소리 처리를 입혀 \`src/assets/voice\`에 넣습니다.\n\n` +
      `| # | 인물 | 들리는 곳 | 대사 |\n|---|---|---|---|\n${rows.join('\n')}\n`,
  );
  for (const l of todo) console.log(`${l.n}  [${l.voice}/${l.where}] ${l.say}`);
  console.log(`\n${todo.length} lines → docs/VOICE_LINES.md`);
}

function fx() {
  if (!existsSync(RAW)) {
    console.error(`No ${RAW}/ folder. Save each line as ${RAW}/<number>.mp3 (see docs/VOICE_LINES.md).`);
    process.exit(1);
  }
  mkdirSync(OUT, { recursive: true });
  const raw = readdirSync(RAW);
  let made = 0;
  const missing = [];
  for (const l of todo) {
    const src = raw.find((f) => f.replace(/\.[a-z0-9]+$/i, '') === l.n || f.startsWith(`${l.n}-`) || f.startsWith(`${l.n}_`));
    if (!src) {
      missing.push(l.n);
      continue;
    }
    const out = `${OUT}/${l.key}.mp3`;
    if (existsSync(out) && !process.env.FORCE) continue;
    if (process.env.DRY) {
      console.log(`would make ${out} from ${RAW}/${src}  [${l.voice}/${l.where}] ${l.say}`);
      continue;
    }
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', `${RAW}/${src}`, '-filter_complex', chain(l), '-map', '[o]', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '96k', out]);
    made++;
    console.log(`made ${out}  [${l.voice}/${l.where}] ${l.say}`);
  }
  console.log(`\n${made} made · ${todo.length - missing.length}/${todo.length} lines have a recording${missing.length ? ` · missing: ${missing.join(' ')}` : ''}`);
}

async function fish() {
  if (!KEY) {
    console.error('FISH_API_KEY is not set.');
    process.exit(1);
  }
  mkdirSync(RAW, { recursive: true });
  for (const l of todo) {
    const file = `${RAW}/${l.n}.mp3`;
    if (existsSync(file) && !process.env.FORCE) continue;
    if (process.env.DRY) {
      console.log(`would ask Fish Audio for ${file}  [${l.voice}] ${l.say}`);
      continue;
    }
    const res = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', model: MODEL },
      body: JSON.stringify({ text: l.say, reference_id: VOICES[l.voice], format: 'mp3', mp3_bitrate: 128, normalize: true }),
    });
    if (!res.ok) {
      console.error(`Fish Audio ${res.status}: ${await res.text()}  (line ${l.n}: ${l.say})`);
      process.exit(1);
    }
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    console.log(`fetched ${file}  [${l.voice}] ${l.say}`);
  }
  fx();
}

async function eleven() {
  const key = process.env.ELEVEN_API_KEY;
  const voices = { male: process.env.ELEVEN_VOICE_MALE, female: process.env.ELEVEN_VOICE_FEMALE, entity: process.env.ELEVEN_VOICE_ENTITY };
  const model = process.env.ELEVEN_MODEL ?? 'eleven_v3';
  if (!key) {
    console.error('ELEVEN_API_KEY is not set.');
    process.exit(1);
  }
  // A voice left unset is skipped: those lines can come from elsewhere (voice-raw/NN.*) or stay on browser speech.
  const lacking = Object.entries(voices).filter(([, v]) => !v).map(([k]) => `ELEVEN_VOICE_${k.toUpperCase()}`);
  if (lacking.length === 3) {
    console.error('Set ELEVEN_VOICE_MALE / _FEMALE / _ENTITY (voice ids from elevenlabs.io → Voices).');
    process.exit(1);
  }
  if (lacking.length) console.log(`(no ${lacking.join(', ')} — those lines are skipped)`);
  mkdirSync(RAW, { recursive: true });
  for (const l of todo) {
    const file = `${RAW}/${l.n}.mp3`;
    if (!voices[l.voice] || (existsSync(file) && !process.env.FORCE)) continue;
    const text = model === 'eleven_v3' && DIRECTION[l.say] ? `${DIRECTION[l.say]} ${l.say}` : l.say;
    if (process.env.DRY) {
      console.log(`would ask ElevenLabs for ${file}  [${l.voice}] ${text}`);
      continue;
    }
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voices[l.voice]}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: model, language_code: 'ko', voice_settings: { stability: 0.4, similarity_boost: 0.8 } }),
    });
    if (!res.ok) {
      console.error(`ElevenLabs ${res.status}: ${await res.text()}  (line ${l.n}: ${l.say})`);
      process.exit(1);
    }
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    console.log(`fetched ${file}  [${l.voice}] ${text}`);
  }
  fx();
}

const mode = process.argv[2] ?? 'fish';
if (mode === 'list') list();
else if (mode === 'fx') fx();
else if (mode === 'eleven') await eleven();
else await fish();
