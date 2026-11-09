// Print a recorder dump as a readable timeline.  node scripts/story-room/timeline.mjs run.json [--all] [--snd]
import { readFileSync } from 'node:fs';
const [file, ...opt] = process.argv.slice(2);
const { L, errors } = JSON.parse(readFileSync(file, 'utf8'));
const t0 = L.find((x) => x.k === 'ME' && /^JUMP/.test(x.v))?.t ?? L[0].t;
const skip = new Set(opt.includes('--all') ? [] : ['memoTr', 'lost', 'recallN', 'flood', 'draft']);
const showSnd = opt.includes('--snd');
for (const x of L) {
  if (skip.has(x.k)) continue;
  if (x.k === 'snd' && !showSnd) continue;
  if (x.k === 'flag' && /^(nudged|seen|opened|dwell-)/.test(x.v)) continue;
  console.log(`${(x.t - t0).toFixed(1).padStart(7)}  ${x.k.padEnd(8)} ${typeof x.v === 'string' ? x.v.slice(0, 110) : x.v}`);
}
console.log('errors:', errors);
