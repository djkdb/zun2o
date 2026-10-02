// The night's sounds as recordings: ElevenLabs sound effects → src/assets/sfx/<id>.mp3.
// The audio engine plays a file for a sound when there is one and synthesizes the
// rest, so any sound can be left out. UI blips stay synthesized on purpose.
//
//   ELEVEN_API_KEY=… npm run sfx        (FORCE=1 remakes, ONLY=whisper,knock limits, DRY=1 prints)
//
// Needs ffmpeg on PATH (trim + loudness). The key never goes into the repo.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';

const OUT = 'src/assets/sfx';
const KEY = process.env.ELEVEN_API_KEY;

// id → what it is, how long. Written as foley, never music; close-miked and dry
// (the engine places them in the building).
const SFX = {
  whisper: ['A woman whispering unintelligibly very close to the ear in an empty room, breathy, slow, creepy, no words clear, no music', 2.5],
  scream: ['A short distant female scream in an empty concrete school building, cut off abruptly, realistic, no music', 1.6],
  drawer: ['Many old wooden card catalogue drawers sliding open one after another in a large dark room, dry wood, creaking runners, no music', 3.5],
  knock: ['Three slow knocks with a knuckle on the glass door of an outdoor phone booth, rain in background, close, no music', 2.0],
  breath: ['Slow shaky breathing of a woman right next to the microphone in silence, realistic, no music', 3.0],
  footsteps: ['Hurried footsteps on a gritty concrete school corridor floor, sneakers, slight echo, no music', 3.0],
  stepsAbove: ['Slow heavy footsteps on the floor above, heard through the ceiling of an empty building, muffled, no music', 3.5],
  creak: ['An old wooden door slowly creaking open in an empty hallway, long creak, no music', 2.5],
  drip: ['Single water drops falling into a puddle in a quiet dark room, sparse, echo, no music', 3.0],
  inhale: ['A sharp frightened intake of breath, close to the microphone, single gasp, no music', 1.0],
  heartbeat: ['A slow heavy human heartbeat, low thumps, close, no music', 3.0],
};

if (!KEY && !process.env.DRY) {
  console.error('ELEVEN_API_KEY is not set.');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
const only = process.env.ONLY?.split(',');
for (const [id, [text, seconds]] of Object.entries(SFX)) {
  if (only && !only.includes(id)) continue;
  const out = `${OUT}/${id}.mp3`;
  if (existsSync(out) && !process.env.FORCE) continue;
  if (process.env.DRY) {
    console.log(`would make ${out} (${seconds}s): ${text}`);
    continue;
  }
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, duration_seconds: seconds, prompt_influence: 0.55 }),
  });
  if (!res.ok) {
    console.error(`ElevenLabs ${res.status}: ${await res.text()}  (${id})`);
    process.exit(1);
  }
  const raw = `${OUT}/.${id}.raw.mp3`;
  writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  // trim the silence at the ends, even out the loudness, mono
  execFileSync('ffmpeg', [
    '-loglevel', 'error', '-y', '-i', raw,
    '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-20:TP=-2',
    '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '96k', out,
  ]);
  rmSync(raw);
  console.log(`made ${out}`);
}
