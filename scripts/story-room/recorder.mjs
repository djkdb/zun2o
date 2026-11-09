// Story-room play harness (see docs/story-room/PLAY_HARNESS.md): a page-side recorder that logs every visible
// change with real time (banners, typing, calls, subtitles, sound starts, flags), plus human-paced helpers.
import { chromium } from 'playwright-core';
import { CHROMIUM } from '../chromium.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

// screenshots: qa-output/story-room/<ROUND>/ (ROUND=round4 node …)
export const OUT = new URL(`../../qa-output/story-room/${process.env.ROUND ?? 'play'}`, import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const INIT = () => {
  window.__L = [];
  window.__T0 = performance.now();
  const L = (k, v) => window.__L.push({ t: +(performance.now() / 1000).toFixed(2), k, v });
  window.__mark = (v) => L('ME', v);
  // sound starts (WebAudio one-shots) and media (voice files)
  try {
    const p = AudioBufferSourceNode.prototype;
    const s0 = p.start;
    p.start = function (...a) {
      try { const d = this.buffer ? this.buffer.duration : 0; if (!this.loop || d > 0) L('snd', `${this.loop ? 'loop ' : ''}${d.toFixed(2)}s`); } catch { /* recording is best-effort */ }
      return s0.apply(this, a);
    };
    const st0 = p.stop;
    p.stop = function (...a) { try { if (this.loop) L('snd', 'loop-stop'); } catch { /* recording is best-effort */ } return st0.apply(this, a); };
  } catch { /* recording is best-effort */ }
  try {
    const m0 = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...a) {
      try { L('media', (this.currentSrc || this.src || (this.querySelector && this.querySelector('source')?.src) || '?').split('/').pop()); } catch { /* recording is best-effort */ }
      return m0.apply(this, a);
    };
  } catch { /* recording is best-effort */ }
  let prev = {};
  const tick = () => {
    const g = window.__game;
    if (!g) return;
    const { save: s, rt: r } = g.getState();
    const cur = {
      clock: s.clock, ch: s.chapter, bat: s.battery, unlocked: s.unlocked,
      typing: Object.entries(r.typing || {}).filter(([, v]) => v).map(([k]) => k).join(',') || '-',
      banner: r.banner ? `#${r.banner.id} [${r.banner.title}] ${r.banner.body}` : '-',
      incoming: r.incoming || '-', call: r.activeCall || '-',
      card: r.chapterCard ? `${r.chapterCard.n} ${r.chapterCard.title}` : '-',
      dialog: r.dialog ? r.dialog.title : '-', scare: r.scare ? r.scare.kind : '-',
      reboot: r.rebooting, finale: r.finale, ending: r.ending || '-',
      draft: r.draft ? r.draft.text : '-', memo: r.memoPlaying, view: `${r.app || 'home'}${r.thread ? '/' + r.thread : ''}`,
      choice: s.choice ? s.choice.id : '-', live: s.liveNote || '-', openLine: r.openLine,
      fin: document.querySelector('.finale, .finale2')?.className || '-',
      brink: document.querySelector('.brink')?.className || '-',
      vsub: document.querySelector('.video-sub')?.textContent || '-',
      vtoast: document.querySelector('.video-toast')?.textContent || '-',
      csub: (() => { const e = document.querySelectorAll('.call-subs > *'); return e.length ? e[e.length - 1].textContent : '-'; })(),
      memoTr: (() => { const e = document.querySelector('.memo-transcript'); if (!e) return '-'; const c = e.children; return c.length ? c[c.length - 1].textContent : e.textContent; })(),
      recallN: document.querySelectorAll('.index-final > p, .final-recall > p').length,
      flood: document.querySelectorAll('.flood-item').length,
      lost: r.lostNonce,
    };
    for (const k of Object.keys(cur)) if (prev[k] !== cur[k]) L(k, cur[k]);
    // messages, per thread
    for (const [th, list] of Object.entries(s.threads)) {
      const n = prev['n_' + th] ?? list.length;
      for (let i = n; i < list.length; i++) L('msg', `${th}${list[i].from === 'me' ? '(me)' : ''}: ${list[i].text}${list[i].attach ? ' [' + list[i].attach.kind + ']' : ''}`);
      cur['n_' + th] = list.length;
      const del = list.filter((m) => m.text === '메시지가 삭제되었습니다.').length;
      if ((prev['d_' + th] ?? del) !== del) L('unsend', th);
      cur['d_' + th] = del;
    }
    const fl = new Set(prev.flags || s.flags);
    for (const f of s.flags) if (!fl.has(f)) L('flag', f);
    cur.flags = [...s.flags];
    prev = cur;
  };
  setInterval(tick, 100);
};

export async function launch(tag) {
  const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  let shot = 0;
  const h = {
    page, browser, errors,
    wait: (ms) => page.waitForTimeout(ms),
    me: (v) => page.evaluate((x) => window.__mark(x), v).catch(() => {}),
    st: () => page.evaluate(() => window.__game.getState()),
    until: async (fn, ms = 120000, arg) => {
      const t = Date.now();
      while (Date.now() - t < ms) {
        if (await page.evaluate(fn, arg).catch(() => false)) return true;
        await page.waitForTimeout(150);
      }
      return false;
    },
    snap: async (name) => {
      shot++;
      const p = `${OUT}/${tag}-${String(shot).padStart(2, '0')}-${name}.png`;
      await page.screenshot({ path: p }).catch(() => {});
      await h.me(`snap ${tag}-${String(shot).padStart(2, '0')}-${name}`);
    },
    dump: async (file) => {
      const L = await page.evaluate(() => window.__L);
      writeFileSync(file, JSON.stringify({ errors, L }, null, 0));
      return L;
    },
    // a person taps whatever is in front; banners/dialogs in the way are swiped/acknowledged
    tap: async (loc, label) => {
      for (let i = 0; i < 10; i++) {
        try {
          if (await page.locator('.dialog button').count()) { await h.wait(1800); await page.locator('.dialog button').first().click({ force: true, timeout: 1500 }).catch(() => {}); await h.me('dismiss dialog'); }
          await loc.first().click({ timeout: 2500 });
          if (label) await h.me(label);
          return true;
        } catch { await h.wait(500); }
      }
      await h.me(`FAILED tap ${label}`);
      return false;
    },
  };
  h.home = () => h.tap(page.locator('.homebar'), 'home');
  h.app = async (name) => { await h.home(); await h.wait(500); await h.tap(page.locator('.app-icon', { hasText: name }), `open ${name}`); await h.wait(600); };
  h.thread = async (name) => { await h.app('메시지'); await h.tap(page.locator('.thread-row', { hasText: name }), `thread ${name}`); await h.wait(500); };
  h.key = (d) => page.locator('.keypad .key', { hasText: new RegExp(`^${d}$`) }).first().click();
  h.bannerTap = async (re, ms = 30000) => {
    // wait for a banner matching re, read it ~1.5 s, tap it
    const ok = await h.until((src) => { const b = window.__game.getState().rt.banner; return b && new RegExp(src).test(`${b.title} ${b.body}`); }, ms, re.source);
    if (!ok) return false;
    await h.wait(1500);
    await page.locator('.banner').first().click({ timeout: 2000 }).catch(() => {});
    await h.me(`tap banner /${re.source}/`);
    await h.wait(500);
    return true;
  };
  h.autodump = (file) => setInterval(() => h.dump(file).catch(() => {}), 8000);
  return h;
}
