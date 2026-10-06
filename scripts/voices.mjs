// The spoken lines, as audio files. Made once, at authoring time; the game only
// plays the files it ships with (src/assets/voice) and never calls a TTS service.
//
//   npm run voices:list     numbered list of every spoken line → docs/VOICE_LINES.md
//   npm run voices:eleven   ElevenLabs (v3, with per-line delivery tags) → voice-raw/NN.mp3 → effects
//                           (ELEVEN_API_KEY=…, ELEVEN_VOICE_MALE / _FEMALE / _ENTITY=<voice id>;
//                            season 2: ELEVEN_VOICE_MOTHER (default: the ENTITY voice) / ELEVEN_VOICE_SOYEON)
//   npm run voices          Fish Audio → voice-raw/NN.mp3 → effects → src/assets/voice
//                           (FISH_API_KEY=… required; keys never go into the repo)
//   npm run voices:fx       effects only: voice-raw/NN.<mp3|wav|m4a|…> → src/assets/voice
//
//   Hands-off ElevenLabs (docs/VOICE_PIPELINE.md):
//   npm run voices:audition  Korean voice candidates per role from the voice library → voice-takes/audition.html
//   npm run voices:auto      several takes per line, each checked by speech-to-text (did it say the line?),
//                            pace, clipping and dead air; the best goes to voice-raw/NN.mp3, then effects.
//                            voice-takes/index.html lets you listen to the top two and pick.
//   npm run voices:pick -- 33:2,40:1   use those takes instead, then effects
//                            (ELEVEN_TAKES=3, ONLY=33-55 or ONLY=11,22, ELEVEN_STABILITY=0.5)
//
// Any other TTS tool or a real recording works too: save each line as
// voice-raw/<number>.<ext> (numbers from docs/VOICE_LINES.md) and run voices:fx.
// The effects need `ffmpeg` on PATH.
//
// Env: FISH_VOICE_MALE / _FEMALE / _ENTITY override the voices below, FISH_MODEL
// (default s1), FORCE=1 to remake existing files, DRY=1 to only print.
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { cer, sayKo, syllables } from '../src/audio/sayKo.ts';
import { CALLS, VIDEO_CALL_LINES } from '../src/content/calls.ts';
import { CALLS_S2 } from '../src/content/s2/calls.ts';
import { MEMO_M1 } from '../src/content/media.ts';
import { MEMO_S2M1, MEMO_S2M2, MEMO_S2TAPE } from '../src/content/s2/media.ts';
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
  // season 2: 엄마 is the same woman as the entity, without the haunting; 소연 is 43
  mother: process.env.FISH_VOICE_MOTHER ?? process.env.FISH_VOICE_ENTITY ?? '3d31499f0e13438bbce8dcce7b7c4298',
  soyeon: process.env.FISH_VOICE_SOYEON,
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
  '도현 씨 목소리, 비슷했죠?': '[calm] [softly] [slowly]',
  // season 2 — 엄마: 1994 words, warm, a little slow; 소연: 43, tired, holding it together
  '소연이니?': '[warm] [tired] [softly]',
  '엄마야. 왜 대답을 안 해.': '[warm] [worried]',
  '목소리가 왜 그러니. 감기 걸렸니.': '[warm] [concerned] [softly]',
  '소연아, 엄마 손이 또 볼펜을 쥐었다. 안 놓아져.': '[scared] [shaky voice]',
  '오늘은 자지도 않았는데 손이 먼저 일어났다.': '[scared] [whispers]',
  '엄마가 쓰기 전에 집에 와. 두 시 전에는 와.': '[pleading] [softly]',
  '그럼 우리 소연이는요.': '[quietly] [shocked]',
  '미안해요. 손이 혼자 움직여요. 벌써 날짜를 썼어요. 이제 이름이에요.': '[scared] [shaky voice]',
  '우리 딸 좀 데려와 주세요. 이름 다 쓰기 전에. 부탁합니다.': '[crying] [pleading]',
  '소연아, 엄마야. 도서관 정리가 좀 늦어.': '[warm] [cheerful]',
  '먼저 자. 엄마 두 시 전에는 와.': '[warm] [softly]',
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

const WHO = { male: '도현', female: '채원', entity: '서미령 (발신자 정보 없음)', mother: '엄마 (서미령, 시즌 2)', soyeon: '소연 (시즌 2)' };

// Every line the game speaks, with its voice and where it is heard (keep in step
// with the speak() calls in Overlays, Memos and Finale). Where decides the effect.
const lines = [];
const S2_CALLS = new Set(Object.keys(CALLS_S2));
for (const call of Object.values(CALLS).filter((c) => !S2_CALLS.has(c.id)))
  for (const l of [...call.lines, ...(call.after ?? [])]) if (l.voice && l.who !== 'sfx') lines.push({ text: l.text, voice: l.voice, where: 'call' });
for (const l of MEMO_M1.lines) {
  if (l.who === '채원') lines.push({ text: l.text, voice: 'female', where: 'memo' });
  if (l.who === '???') lines.push({ text: l.text, voice: 'entity', where: 'memo' });
}
// 새녹음 18: its two fixed lines (the one with the player's name can't be prerecorded)
for (const text of ['다 적어 뒀어요.', '이름은 몰라도 괜찮아요. 두 시에 봐요.']) lines.push({ text, voice: 'entity', where: 'memo' });
for (const text of VIDEO_CALL_LINES) lines.push({ text, voice: 'female', where: 'video' });
// Season 2, numbered after season 1 so season 1's voice-raw numbers stay put. A line 엄마 says
// that season 1 already recorded in her voice ("다 적어 뒀어요.") uses that recording, not a new one.
const s1Keys = new Set(lines.map((l) => voiceKey(l.text, l.voice)));
const s2 = [];
for (const call of Object.values(CALLS_S2))
  for (const l of [...call.lines, ...(call.after ?? []), ...Object.values(call.afterBy ?? {}).flat()]) if (l.voice && l.who !== 'sfx') s2.push({ text: l.text, voice: l.voice, where: 'call' });
for (const [memo, where] of [[MEMO_S2M1, 'memo'], [MEMO_S2M2, 'memo'], [MEMO_S2TAPE, 'tape']])
  for (const l of memo.lines) {
    const said = l.text.replace(/^\([^)]*\)\s*/, '');
    if (l.who === '소연') s2.push({ text: said, voice: 'soyeon', where });
    if (l.who === '엄마') s2.push({ text: said, voice: s1Keys.has(voiceKey(said, 'entity')) ? 'entity' : 'mother', where });
  }
lines.push(...s2.filter((l) => !s1Keys.has(voiceKey(l.text, l.voice))));

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
// season 2: a 1994 answering-machine cassette — narrow, a little warped, hiss under it
const TAPE = 'highpass=f=280,lowpass=f=3600,vibrato=f=0.8:d=0.05,acompressor=threshold=-22dB:ratio=5,volume=1.5';
const LOWER = 'asetrate=44100*0.94,aresample=44100,atempo=1.0638';
const ROOM = 'aecho=0.8:0.7:70|190|340:0.28|0.16|0.08';
const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse';
function chain(l) {
  const her = l.voice === 'entity';
  const fx = l.where === 'call' ? PHONE : l.where === 'memo' ? MEMO : l.where === 'tape' ? TAPE : VIDEO;
  const noise = l.where === 'video' ? 0.002 : l.where === 'tape' ? 0.012 : 0.005;
  const voice = [TRIM, 'aresample=44100', her ? LOWER : null, fx, her ? ROOM : null, 'loudnorm=I=-18:TP=-2:LRA=9'].filter(Boolean).join(',');
  // a bed of line noise under every line, so it never sounds like a studio
  return `[0:a]${voice}[v];anoisesrc=color=pink:amplitude=${noise}:sample_rate=44100[n];[v][n]amix=inputs=2:duration=first:weights=1 1[o]`;
}

function list() {
  const rows = todo.map((l) => `| ${l.n} | ${WHO[l.voice]} | ${l.where === 'call' ? '통화' : l.where === 'memo' ? '녹음' : l.where === 'tape' ? '자동응답기' : '영상통화'} | ${l.say} |`);
  writeFileSync(
    'docs/VOICE_LINES.md',
    `# 음성 대사 목록\n\n\`npm run voices:list\`가 만든 파일입니다. 대사를 바꾸면 다시 실행하세요.\n\n` +
      `한 줄에 파일 하나: \`voice-raw/<번호>.mp3\` (wav·m4a도 됨)로 저장하고 \`npm run voices:fx\`를 실행하면\n` +
      `통화 음질·녹음실 울림·서미령 목소리 처리를 입혀 \`src/assets/voice\`에 넣습니다.\n\n` +
      `시즌 2(33번부터): 엄마는 서미령과 같은 목소리(\`ELEVEN_VOICE_MOTHER\`, 비우면 \`ELEVEN_VOICE_ENTITY\`)로, 귀신 처리 없이 따뜻하게.\n` +
      `소연(43)은 \`ELEVEN_VOICE_SOYEON\`. 녹음이 없는 시즌 2 대사는 게임에서 자막으로만 나옵니다.\n\n` +
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
  const voices = {
    male: process.env.ELEVEN_VOICE_MALE,
    female: process.env.ELEVEN_VOICE_FEMALE,
    entity: process.env.ELEVEN_VOICE_ENTITY,
    // season 2: 엄마 is the same woman as the entity (warm, no effects on her); 소연 needs her own voice
    mother: process.env.ELEVEN_VOICE_MOTHER ?? process.env.ELEVEN_VOICE_ENTITY,
    soyeon: process.env.ELEVEN_VOICE_SOYEON,
  };
  const model = process.env.ELEVEN_MODEL ?? 'eleven_v3';
  if (!key) {
    console.error('ELEVEN_API_KEY is not set.');
    process.exit(1);
  }
  // A voice left unset is skipped: those lines can come from elsewhere (voice-raw/NN.*) or stay on browser speech.
  const lacking = Object.entries(voices).filter(([, v]) => !v).map(([k]) => `ELEVEN_VOICE_${k.toUpperCase()}`);
  if (lacking.length === Object.keys(voices).length) {
    console.error('Set ELEVEN_VOICE_MALE / _FEMALE / _ENTITY / _MOTHER / _SOYEON (voice ids from elevenlabs.io → Voices).');
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

// ─── hands-off ElevenLabs: audition, takes, automatic checking ─────────────

const TAKES = 'voice-takes';
const XI = 'https://api.elevenlabs.io';
// Who each voice is, for finding Korean candidates in the voice library.
const ROLES = {
  male: { who: '도현 (20대 남성, 불안하고 다급함)', gender: 'male', age: 'young' },
  female: { who: '채원 (20대 여성, 겁에 질린 속삭임)', gender: 'female', age: 'young' },
  entity: { who: '서미령 (41세 사서, 차분하고 낮게 — 귀신)', gender: 'female', age: 'middle_aged' },
  mother: { who: '엄마 (서미령, 시즌 2 — 따뜻하게)', gender: 'female', age: 'middle_aged' },
  soyeon: { who: '소연 (43세, 지치고 버티는 목소리)', gender: 'female', age: 'middle_aged' },
};

function xiKey() {
  const key = process.env.ELEVEN_API_KEY;
  if (!key) {
    console.error('ELEVEN_API_KEY is not set (cloud environment settings → environment variables; never in the repo).');
    process.exit(1);
  }
  return key;
}

async function xi(path, init = {}) {
  const res = await fetch(`${XI}${path}`, { ...init, headers: { 'xi-api-key': xiKey(), ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status} ${path}: ${(await res.text()).slice(0, 400)}`);
  return res;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const page = (title, body) =>
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>` +
  `<style>body{font:15px/1.5 -apple-system,sans-serif;background:#111;color:#eee;margin:0;padding:16px;max-width:760px}h2{font-size:16px;margin:26px 0 6px}` +
  `.row{background:#1c1c1e;border-radius:14px;padding:12px;margin:8px 0}.row small{color:#999}audio{width:100%;margin:6px 0}label{display:block;margin:4px 0}` +
  `textarea{width:100%;height:60px;background:#000;color:#9f9;border:1px solid #333;border-radius:8px}button{font:inherit;padding:8px 14px;border-radius:10px;border:0;background:#0a84ff;color:#fff}</style>` +
  `<h1 style="font-size:20px">${esc(title)}</h1>${body}`;

/** Korean voices from the shared library for each role, with their own preview clips (no credits used, nothing added to the account). */
async function audition() {
  mkdirSync(TAKES, { recursive: true });
  const mine = (await (await xi('/v1/voices')).json()).voices ?? [];
  const out = {};
  for (const [role, r] of Object.entries(ROLES)) {
    const q = new URLSearchParams({ page_size: '12', language: 'ko', gender: r.gender, age: r.age, sort: 'trending' });
    const found = (await (await xi(`/v1/shared-voices?${q}`)).json()).voices ?? [];
    out[role] = found.map((v) => ({ id: v.voice_id, owner: v.public_owner_id, name: v.name, desc: [v.accent, v.descriptive, v.use_case].filter(Boolean).join(' · '), preview: v.preview_url }));
    console.log(`${role}: ${out[role].length} candidates`);
  }
  writeFileSync(`${TAKES}/audition.json`, JSON.stringify({ mine: mine.map((v) => ({ id: v.voice_id, name: v.name, preview: v.preview_url })), roles: out }, null, 2));
  const body =
    `<p>역할마다 마음에 드는 목소리의 <b>id</b>를 골라 주세요. (미리듣기는 목소리 주인이 녹음한 샘플이라 대사와 다릅니다.)</p>` +
    `<h2>내 계정의 목소리</h2>${mine.map((v) => `<div class="row"><b>${esc(v.name)}</b> <small>${esc(v.voice_id)}</small>${v.preview_url ? `<audio controls preload="none" src="${esc(v.preview_url)}"></audio>` : ''}</div>`).join('')}` +
    Object.entries(out)
      .map(([role, vs]) => `<h2>${esc(ROLES[role].who)}</h2>${vs.map((v) => `<div class="row"><b>${esc(v.name)}</b> <small>${esc(v.desc)}<br>id ${esc(v.id)}</small><audio controls preload="none" src="${esc(v.preview)}"></audio></div>`).join('')}`)
      .join('');
  writeFileSync(`${TAKES}/audition.html`, page('목소리 오디션', body));
  console.log(`\n→ ${TAKES}/audition.html (pick a voice per role, then set ELEVEN_VOICE_MALE / _FEMALE / _ENTITY / _MOTHER / _SOYEON)`);
}

/** Add a library voice to the account so text-to-speech can use it: ADOPT=<owner id>:<voice id>[,…] */
async function adopt() {
  for (const pair of (process.env.ADOPT ?? '').split(',').filter(Boolean)) {
    const [owner, id] = pair.split(':');
    const res = await xi(`/v1/voices/add/${owner}/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_name: `12pct-${id.slice(0, 6)}` }) });
    console.log(`added ${id} →`, (await res.json()).voice_id);
  }
}

function only(l) {
  const spec = process.env.ONLY;
  if (!spec) return true;
  const n = Number(l.n);
  return spec.split(',').some((part) => {
    const [a, b] = part.split('-').map(Number);
    return b ? n >= a && n <= b : n === a;
  });
}

function analyse(file, l) {
  // ffmpeg writes its analysis (and the duration) to stderr; no ffprobe needed
  const res = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'volumedetect,silencedetect=noise=-38dB:d=0.9', '-f', 'null', '-']).stderr.toString();
  const [, hh, mm, ss] = /Duration: (\d+):(\d+):([\d.]+)/.exec(res) ?? [0, 0, 0, 0];
  const dur = Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
  const peak = Number(/max_volume: (-?[\d.]+) dB/.exec(res)?.[1] ?? -99);
  const starts = [...res.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  // a pause in the middle (not the lead-in or the tail) where the line has no "…" to justify it
  const gaps = starts.filter((s) => s > 0.3 && s < dur - 1.0).length;
  const syl = syllables(l.say).length;
  const pace = syl / Math.max(0.3, dur);
  return { dur, peak, gaps, pace };
}

/** Lower is better: wrong or missing words weigh most, then pace, clipping, dead air, a read-out tag. */
function score(l, a, heard) {
  const quiet = /whisper|slowly|softly|monotone/.test(DIRECTION[l.say] ?? '');
  const [lo, hi] = quiet ? [2.2, 5.5] : [3.2, 7.2];
  const e = cer(l.say, heard);
  const pacePen = a.pace < lo ? (lo - a.pace) * 10 : a.pace > hi ? (a.pace - hi) * 10 : 0;
  const tagRead = /[a-z]{3,}/i.test(heard) ? 30 : 0;
  const gapPen = /…|\.\.\./.test(l.text) ? 0 : a.gaps * 6;
  return { total: Math.round((e * 100 + pacePen + (a.peak > -0.3 ? 15 : 0) + gapPen + tagRead) * 10) / 10, cer: Math.round(e * 1000) / 1000, pacePen: Math.round(pacePen * 10) / 10 };
}

async function transcribe(file) {
  // the check needs ElevenLabs speech-to-text (free plan is enough); without it only pace/clipping are scored
  if (!process.env.ELEVEN_API_KEY) return '';
  const form = new FormData();
  form.append('model_id', 'scribe_v1');
  form.append('language_code', 'kor');
  form.append('file', new Blob([readFileSync(file)], { type: 'audio/mpeg' }), 'take.mp3');
  const res = await xi('/v1/speech-to-text', { method: 'POST', body: form });
  return (await res.json()).text ?? '';
}

function voiceIds() {
  return {
    male: process.env.ELEVEN_VOICE_MALE,
    female: process.env.ELEVEN_VOICE_FEMALE,
    entity: process.env.ELEVEN_VOICE_ENTITY,
    mother: process.env.ELEVEN_VOICE_MOTHER ?? process.env.ELEVEN_VOICE_ENTITY,
    soyeon: process.env.ELEVEN_VOICE_SOYEON,
  };
}

// Typecast (Korean-native voices, emotion presets + context-aware "smart" emotion).
// DIRECTION's ElevenLabs tags map onto its seven presets.
function tcPreset(l) {
  const d = DIRECTION[l.say] ?? '';
  if (/whisper/.test(d)) return 'whisper';
  if (/crying|pleading|tired|sighs|shaky|scared|terrified/.test(d)) return 'sad';
  if (/urgent|panicked|desperate|frustrated|fast|anxious|nervous/.test(d)) return 'toneup';
  if (/cheerful/.test(d)) return 'happy';
  if (/calm|softly|slowly|monotone|cold|quietly/.test(d)) return 'tonedown';
  return 'normal';
}
/** The lines around this one in the same scene, so "smart" emotion knows what is going on. */
function context(l) {
  const i = todo.indexOf(l);
  const near = (j) => (todo[j] && todo[j].where === l.where ? todo[j].say : undefined);
  return { previous_text: near(i - 1), next_text: near(i + 1) };
}
async function typecast(l, t, file) {
  const voice = process.env[`TYPECAST_VOICE_${l.voice.toUpperCase()}`] ?? (l.voice === 'mother' ? process.env.TYPECAST_VOICE_ENTITY : undefined);
  // smart | preset | auto (whispered lines as a whisper preset, the rest smart) | unset: take 1 smart, takes 2–3 preset
  const style = process.env.TYPECAST_STYLE;
  const smart = style === 'auto' ? tcPreset(l) !== 'whisper' : style ? style === 'smart' : t === 1;
  const prompt = smart
    ? { emotion_type: 'smart', ...Object.fromEntries(Object.entries(context(l)).filter(([, v]) => v)) }
    : { emotion_type: 'preset', emotion_preset: tcPreset(l), emotion_intensity: t === 3 ? 1.6 : 1.2 };
  let tries;
  for (;;) {
    const res = await fetch('https://api.typecast.ai/v1/text-to-speech', {
      method: 'POST',
      headers: { 'X-API-KEY': process.env.TYPECAST_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'ssfm-v30', voice_id: voice, text: sayKo(l.say), language: 'kor', prompt, seed: 100 + t * 7 + Number(l.n), output: { audio_format: 'mp3', target_lufs: -16 } }),
    });
    // a free account that asks too fast gets flagged: back off hard on 429, and stop at once on a 403
    if (res.status === 429 && (tries = (tries ?? 0) + 1) <= 3) {
      await new Promise((r) => setTimeout(r, 30000 * tries));
      continue;
    }
    if (!res.ok) throw new Error(`Typecast ${res.status}: ${(await res.text()).slice(0, 300)} (line ${l.n}) — stopped; finished takes are kept, run again later to resume`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    await new Promise((r) => setTimeout(r, Number(process.env.TC_DELAY_MS ?? 15000)));
    return smart ? 'smart' : `${prompt.emotion_preset} ${prompt.emotion_intensity}`;
  }
}

async function auto() {
  const tc = process.env.TTS === 'typecast';
  if (tc && !process.env.TYPECAST_API_KEY) {
    console.error('TYPECAST_API_KEY is not set.');
    process.exit(1);
  }
  if (!tc) xiKey();
  const voices = tc
    ? Object.fromEntries(Object.keys(ROLES).map((k) => [k, process.env[`TYPECAST_VOICE_${k.toUpperCase()}`] ?? (k === 'mother' ? process.env.TYPECAST_VOICE_ENTITY : undefined)]))
    : voiceIds();
  const model = process.env.ELEVEN_MODEL ?? 'eleven_v3';
  const takes = Number(process.env.TAKES ?? process.env.ELEVEN_TAKES ?? 3);
  const v3 = !tc && model === 'eleven_v3';
  mkdirSync(TAKES, { recursive: true });
  mkdirSync(RAW, { recursive: true });
  const reportFile = `${TAKES}/report.json`;
  const report = existsSync(reportFile) ? JSON.parse(readFileSync(reportFile, 'utf8')) : {};
  const work = todo.filter((l) => only(l) && voices[l.voice]);
  if (!work.length) {
    console.error('Nothing to do: set ELEVEN_VOICE_* for the roles you want (npm run voices:audition helps pick).');
    process.exit(1);
  }
  for (const l of work) {
    const said = sayKo(l.say);
    const text = v3 && DIRECTION[l.say] ? `${DIRECTION[l.say]} ${said}` : said;
    const rows = [];
    for (let t = 1; t <= takes; t++) {
      const file = `${TAKES}/${l.n}-t${t}.mp3`;
      if (!existsSync(file) || process.env.FORCE) {
        if (process.env.DRY) {
          console.log(`would ask for ${file}  [${l.voice}] ${text}`);
          continue;
        }
        if (tc) await typecast(l, t, file);
        else {
          // v3 takes only 0 / 0.5 / 1 for stability: one braver take among steadier ones
          const stability = v3 ? (t === 2 ? 0 : Number(process.env.ELEVEN_STABILITY ?? 0.5)) : Number(process.env.ELEVEN_STABILITY ?? 0.45);
          const body = { text, model_id: model, language_code: 'ko', seed: 1000 + t * 17 + Number(l.n), voice_settings: { stability, similarity_boost: 0.8 } };
          const res = await xi(`/v1/text-to-speech/${voices[l.voice]}?output_format=mp3_44100_128`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, body: JSON.stringify(body) });
          writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        }
      }
      if (process.env.DRY) continue;
      const a = analyse(file, l);
      const heard = await transcribe(file);
      rows.push({ take: t, file, heard, ...a, ...score(l, a, heard) });
    }
    if (process.env.DRY) continue;
    rows.sort((x, y) => x.total - y.total);
    report[l.n] = { line: l.say, said: text, voice: l.voice, where: l.where, takes: rows };
    writeFileSync(reportFile, JSON.stringify(report, null, 2));
    const best = rows[0];
    copyFileSync(best.file, `${RAW}/${l.n}.mp3`);
    const flag = best.cer > 0.15 ? '  ⚠ check: still misread' : '';
    console.log(`${l.n} best t${best.take} score ${best.total} (cer ${best.cer}, ${best.pace.toFixed(1)} syl/s)  heard: ${best.heard}${flag}`);
  }
  if (process.env.DRY) return;
  listenPage(report);
  process.env.FORCE = '1';
  fx();
}

function listenPage(report) {
  const body =
    `<p>대사마다 자동 채점 1·2위입니다. 더 나은 쪽을 고르고 아래 칸의 글자를 복사해 보내 주세요. 고르지 않은 줄은 1위가 쓰입니다.</p>` +
    Object.entries(report)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(
        ([n, r]) =>
          `<h2>${n}. ${esc(r.line)}</h2><small>${esc(WHO[r.voice])} · ${esc(r.where)} · 보낸 문장: ${esc(r.said)}</small>` +
          r.takes
            .slice(0, 2)
            .map((t, i) => `<div class="row"><label><input type="radio" name="n${n}" value="${t.take}" data-top="${i ? 0 : 1}" ${i ? '' : 'checked'}> ${i ? '2위' : '1위'} · take ${t.take} · 점수 ${t.total} · ${t.dur.toFixed(1)}초<br><small>받아쓰기: ${esc(t.heard)}</small></label><audio controls preload="none" src="${esc(t.file.replace(`${TAKES}/`, ''))}"></audio></div>`)
            .join(''),
      )
      .join('') +
    `<h2>고른 결과</h2><textarea id="out" readonly></textarea><p><button onclick="pick()">결과 만들기</button></p>` +
    `<script>function pick(){const o=[];document.querySelectorAll('input[type=radio]:checked').forEach(r=>{if(r.dataset.top==='0')o.push(r.name.slice(1)+':'+r.value)});document.getElementById('out').value=o.join(',')||'(모두 1위)'}</script>`;
  writeFileSync(`${TAKES}/index.html`, page('음성 후보 듣기', body));
  console.log(`\n→ ${TAKES}/index.html`);
}

/** npm run voices:pick -- 33:2,40:1 */
function pick() {
  const spec = process.argv[3] ?? '';
  for (const part of spec.split(',').filter(Boolean)) {
    const [n, t] = part.split(':');
    const src = `${TAKES}/${n.padStart(2, '0')}-t${t}.mp3`;
    if (!existsSync(src)) {
      console.error(`no ${src}`);
      process.exit(1);
    }
    copyFileSync(src, `${RAW}/${n.padStart(2, '0')}.mp3`);
    console.log(`${n}: take ${t}`);
  }
  process.env.FORCE = '1';
  fx();
}

// ─── a human performance instead: the recording script ─────────────────────
// TTS keeps the calm, flat lines (her). Anything that has to cry, panic or whisper in
// fear is acted by a person and only re-voiced (speech-to-speech), so the breath stays real.
const KO_TAG = {
  whispers: '속삭이듯', slowly: '천천히', calm: '차분하게', softly: '작게', anxious: '불안하게', 'breathing heavily': '숨 가쁘게',
  desperate: '절박하게', nervous: '긴장해서', fast: '빠르게', 'shaky voice': '목소리 떨리게', frustrated: '답답하게', quietly: '낮게',
  urgent: '다급하게', panicked: '공황 상태로', cold: '차갑게', terrified: '겁에 질려', warm: '따뜻하게', tired: '지쳐서', worried: '걱정하며',
  concerned: '걱정하며', scared: '무서워하며', pleading: '애원하듯', shocked: '충격받은 듯', crying: '울먹이며', cheerful: '밝게',
  monotone: '감정 없이 단조롭게', sighs: '한숨 섞어', gasps: '숨을 훅 들이켜며',
};
const HOT = /crying|terrified|panicked|desperate|shaky|anxious|scared|gasps|pleading|frustrated|nervous|urgent/;
function script() {
  const rows = todo.map((l) => {
    const tags = [...(DIRECTION[l.say] ?? '').matchAll(/\[([^\]]+)\]/g)].map((m) => KO_TAG[m[1]] ?? m[1]);
    const human = l.voice === 'male' || l.voice === 'female' || l.voice === 'soyeon' || HOT.test(DIRECTION[l.say] ?? '');
    return { ...l, how: tags.join(', ') || '자연스럽게', human };
  });
  const people = rows.filter((r) => r.human);
  const where = { call: '전화 통화', memo: '폰 녹음', tape: '1994년 자동응답기 테이프', video: '영상통화' };
  writeFileSync(
    'docs/RECORDING_SCRIPT.md',
    `# 녹음 대본 (사람 연기 → 목소리 변환)\n\n\`npm run voices:script\`가 만듭니다. 번호는 docs/VOICE_LINES.md와 같습니다.\n\n` +
      `**사람이 연기할 줄 ${people.length}개** — 울음·공황·겁에 질린 속삭임, 그리고 도현·채원·소연의 모든 대사. 나머지 ${rows.length - people.length}줄(서미령·엄마의 차분한 대사)은 TTS로 둡니다. 차분하고 단조로운 귀신 목소리는 TTS가 오히려 잘 맞습니다.\n\n` +
      `## 녹음하는 법\n` +
      `- 조용하고 울리지 않는 방(옷장 앞, 이불 속도 좋음). 폰 음성 메모 앱, 입에서 한 뼘.\n` +
      `- **한 줄을 2~3번씩**, 줄 앞에 번호를 말하고("삼십삼 번") 2초 쉬고 대사. 한 파일에 여러 줄을 넣어도 됩니다. 제가 받아쓰기로 번호를 찾아 자릅니다.\n` +
      `- 성별·나이는 신경 쓰지 마세요. 음색은 변환이 바꿉니다. 바뀌지 않는 건 **숨, 떨림, 멈춤, 감정**입니다. 그것만 진짜로.\n` +
      `- 도현(20대 남자) 줄은 남자가 녹음하면 변환이 더 자연스럽습니다.\n` +
      `- 원본 녹음은 저장소에 올리지 않습니다(voice-raw는 커밋 제외). 변환된 소리만 게임에 들어가고, 게임은 여전히 마이크를 쓰지 않습니다.\n\n` +
      `| # | 인물 | 장면 | 어떻게 | 대사 |\n|---|---|---|---|---|\n` +
      people.map((r) => `| ${r.n} | ${WHO[r.voice]} | ${where[r.where]} | ${r.how} | ${r.say} |`).join('\n') +
      `\n\n## TTS로 두는 줄\n\n| # | 인물 | 어떻게 | 대사 |\n|---|---|---|---|\n` +
      rows.filter((r) => !r.human).map((r) => `| ${r.n} | ${WHO[r.voice]} | ${r.how} | ${r.say} |`).join('\n') +
      '\n',
  );
  console.log(`${people.length} lines to act, ${rows.length - people.length} stay TTS → docs/RECORDING_SCRIPT.md`);
}

/**
 * One long recording (e.g. a Typecast web project with a pause between lines, in
 * docs/VOICE_LINES.md order) → one file per line. Splits on the pauses, then checks
 * each piece against its line with speech-to-text when ELEVEN_API_KEY is there.
 *   npm run voices:split -- path/to/all.mp3 [first line number, default 01]
 *   npm run voices:split -- path/to/dohyun.mp3 male      (one character's lines, in order)
 *   npm run voices:split -- path/to/miso.mp3 entity,mother
 */
async function split() {
  const file = process.argv[3];
  const arg = process.argv[4] ?? '1';
  const voices = /^\d+$/.test(arg) ? null : arg.split(',');
  const from = voices ? 1 : Number(arg);
  if (!file || !existsSync(file)) {
    console.error('usage: npm run voices:split -- <file.mp3> [first line number]');
    process.exit(1);
  }
  const log = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', `silencedetect=noise=${process.env.SPLIT_DB ?? -40}dB:d=${process.env.SPLIT_GAP ?? 0.6}`, '-f', 'null', '-']).stderr.toString();
  const [, hh, mm, ss] = /Duration: (\d+):(\d+):([\d.]+)/.exec(log) ?? [0, 0, 0, 0];
  const dur = Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  // speech runs between silences
  const pieces = [];
  let t = 0;
  starts.forEach((s, i) => {
    if (s - t > 0.25) pieces.push([Math.max(0, t - 0.08), s + 0.12]);
    t = ends[i] ?? dur;
  });
  if (dur - t > 0.25) pieces.push([Math.max(0, t - 0.08), dur]);
  const lines = todo.filter((l) => (voices ? voices.includes(l.voice) : Number(l.n) >= from));
  console.log(`${pieces.length} pieces for ${lines.length} lines (${voices ? voices.join('+') : `from ${String(from).padStart(2, '0')}`})`);
  if (pieces.length !== lines.length) console.log('⚠ counts differ — adjust SPLIT_GAP (seconds) / SPLIT_DB, or check the recording order');
  mkdirSync(RAW, { recursive: true });
  for (let i = 0; i < Math.min(pieces.length, lines.length); i++) {
    const l = lines[i];
    const out = `${RAW}/${l.n}.mp3`;
    const [a, b] = pieces[i];
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(a), '-to', String(b), '-i', file, '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '128k', out]);
    const heard = await transcribe(out);
    const e = heard ? cer(l.say, heard) : null;
    console.log(`${l.n} ${(b - a).toFixed(1)}s ${e === null ? '' : `cer ${e.toFixed(2)}${e > 0.25 ? ' ⚠' : ''}`}  ${l.say}${heard ? `  | heard: ${heard}` : ''}`);
  }
}

const mode = process.argv[2] ?? 'fish';
if (mode === 'list') list();
else if (mode === 'split') await split();
else if (mode === 'script') script();
else if (mode === 'fx') fx();
else if (mode === 'eleven') await eleven();
else if (mode === 'audition') await audition();
else if (mode === 'adopt') await adopt();
else if (mode === 'auto') await auto();
else if (mode === 'pick') pick();
else await fish();
