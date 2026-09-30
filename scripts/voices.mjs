// Makes the spoken lines as mp3 files with Fish Audio (https://fish.audio),
// once, at authoring time. The game only plays the files it ships with; it
// never calls Fish Audio itself, and the key never goes into the repo.
//
//   FISH_API_KEY=… FISH_VOICE_MALE=<voice id> [FISH_VOICE_FEMALE=…] [FISH_VOICE_ENTITY=…] npm run voices
//
// Options (env): FISH_MODEL (default s1), FORCE=1 to remake existing files,
// DRY=1 to only list what would be made.
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { CALLS, VIDEO_CALL_LINES } from '../src/content/calls.ts';
import { MEMO_M1 } from '../src/content/media.ts';
import { spokenText, voiceKey } from '../src/audio/voiceKey.ts';

const OUT = 'src/assets/voice';
const KEY = process.env.FISH_API_KEY;
const MODEL = process.env.FISH_MODEL ?? 's1';
const VOICES = { male: process.env.FISH_VOICE_MALE, female: process.env.FISH_VOICE_FEMALE, entity: process.env.FISH_VOICE_ENTITY };

// Every line the game speaks, with its voice (keep in step with speak() calls).
const lines = [];
for (const call of Object.values(CALLS))
  for (const l of [...call.lines, ...(call.after ?? [])]) if (l.voice && l.who !== 'sfx') lines.push({ text: l.text, voice: l.voice });
for (const l of MEMO_M1.lines) {
  if (l.who === '채원') lines.push({ text: l.text, voice: 'female' });
  if (l.who === '???') lines.push({ text: l.text, voice: 'entity' });
}
for (const text of VIDEO_CALL_LINES) lines.push({ text, voice: 'female' });

const todo = [...new Map(lines.filter((l) => spokenText(l.text)).map((l) => [voiceKey(l.text, l.voice), l])).entries()];
mkdirSync(OUT, { recursive: true });

let made = 0;
let skipped = 0;
const missing = new Set();
for (const [key, { text, voice }] of todo) {
  const file = `${OUT}/${key}.mp3`;
  if (!VOICES[voice]) {
    missing.add(voice);
    continue;
  }
  if (existsSync(file) && !process.env.FORCE) {
    skipped++;
    continue;
  }
  if (process.env.DRY) {
    console.log(`would make ${file}  [${voice}] ${spokenText(text)}`);
    continue;
  }
  if (!KEY) {
    console.error('FISH_API_KEY is not set.');
    process.exit(1);
  }
  const res = await fetch('https://api.fish.audio/v1/tts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', model: MODEL },
    body: JSON.stringify({ text: spokenText(text), reference_id: VOICES[voice], format: 'mp3', mp3_bitrate: 128, normalize: true }),
  });
  if (!res.ok) {
    console.error(`Fish Audio ${res.status}: ${await res.text()}  (line: ${spokenText(text)})`);
    process.exit(1);
  }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  made++;
  console.log(`made ${file}  [${voice}] ${spokenText(text)}`);
}

console.log(`\n${made} made, ${skipped} already there, ${todo.length} lines in all.`);
if (missing.size) console.log(`No voice id for: ${[...missing].join(', ')} — those lines stay on browser speech. Set FISH_VOICE_${[...missing].map((v) => v.toUpperCase()).join(' / FISH_VOICE_')}.`);
