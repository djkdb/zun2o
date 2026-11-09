// Banner lifetimes from a recorder dump: how many were replaced before they could be read (< 2 s).
// node scripts/story-room/banners.mjs run.json …  (times from the first ME 'JUMP…' mark, else the start)
import { readFileSync } from 'node:fs';
for (const f of process.argv.slice(2)) {
  const { L } = JSON.parse(readFileSync(f, 'utf8'));
  const t0 = L.find((x) => x.k === 'ME' && /^JUMP/.test(x.v))?.t ?? L[0].t;
  const b = L.filter((x) => x.k === 'banner' || (x.k === 'ME' && /tap|home|back|open/.test(x.v)));
  let cur = null; const out = [];
  for (const x of b) {
    if (x.k === 'ME') { if (cur) cur.byMe = true; continue; }
    if (cur) { out.push({ ...cur, dur: x.t - cur.t, replaced: x.v !== '-' }); }
    cur = x.v === '-' ? null : { t: x.t, v: x.v };
  }
  const short = out.filter((o) => o.replaced && o.dur < 2.0);
  console.log(`\n${f}: ${out.length} banners, ${short.length} replaced in <2.0s`);
  for (const o of short) console.log(`  ${(o.t - t0).toFixed(1).padStart(6)}  ${o.dur.toFixed(1)}s  ${o.v.slice(0, 70)}`);
}
