// Mobile layout audit: visits the key screens at several phone sizes (plus
// reduced motion) and reports anything that sticks out of the screen, scrolls
// sideways, or is too small to tap. Needs `npm run build && npm run preview`.
//
// Env: QA_URL (default http://localhost:4173/), CHROMIUM
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.QA_URL ?? 'http://localhost:4173/';
const OUT = 'qa-output/layout';
mkdirSync(OUT, { recursive: true });
const SIZES = [
  [390, 844],
  [360, 640],
  [320, 568],
  [430, 932],
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const problems = [];

async function audit(page, label) {
  const found = await page.evaluate(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const out = [];
    for (const el of document.querySelectorAll('.device *')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
      if (el.closest('.scare, .glitch, .dbg, .dbg-fab, svg, .rotate-note, .wave')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Inside a scroll container, being below the fold is fine.
      let clipped = false;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ps = getComputedStyle(p);
        if (/(auto|scroll|hidden)/.test(ps.overflow + ps.overflowX + ps.overflowY)) {
          const pr = p.getBoundingClientRect();
          if (r.left >= pr.left - 1 && r.right <= pr.right + 1) clipped = true;
          break;
        }
      }
      if ((r.right > W + 1 || r.left < -1) && !clipped) out.push(`overflows horizontally: ${el.className || el.tagName} (${Math.round(r.left)}–${Math.round(r.right)})`);
      if ((el.tagName === 'BUTTON' || el.tagName === 'INPUT') && !el.disabled && r.top < H && r.bottom > 0) {
        // A control inside a <label> is tapped through the whole label.
        const hit = el.closest('label')?.getBoundingClientRect() ?? r;
        const min = Math.min(hit.width, hit.height);
        if (min < 28 && !el.closest('.keypad')) out.push(`small tap target (${Math.round(r.width)}×${Math.round(r.height)}): ${el.className || el.textContent?.trim().slice(0, 20)}`);
      }
    }
    if (document.documentElement.scrollWidth > W + 1) out.push(`page scrolls sideways (${document.documentElement.scrollWidth} > ${W})`);
    return [...new Set(out)];
  });
  for (const f of found) problems.push(`${label}: ${f}`);
  await page.screenshot({ path: `${OUT}/${label}.png` });
}

const debugClick = async (page, text) => {
  if (!(await page.locator('.dbg').count())) await page.click('.dbg-fab');
  await page.locator('.dbg button', { hasText: text }).first().click();
};

for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: w === 360 ? 'reduce' : 'no-preference', hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const tag = `${w}x${h}`;
  await page.goto(`${BASE}?debug=1&speed=6`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.coldopen-actions.show', { timeout: 15000 });
  await audit(page, `${tag}-coldopen`);
  await page.click('.coldopen-actions .primary');
  await page.waitForSelector('.lock');
  await page.waitForTimeout(600);
  await audit(page, `${tag}-lock`);
  await debugClick(page, /^CH1$/);
  await page.locator('.dbg button', { hasText: '—' }).click();
  await page.waitForTimeout(3600);
  await audit(page, `${tag}-home`);
  // chat with a photo card
  await page.locator('.app-icon', { hasText: '메시지' }).click();
  await page.locator('.thread-row', { hasText: '발신자 표시제한' }).click();
  await page.waitForTimeout(9000);
  await audit(page, `${tag}-chat`);
  // keyboard up: the reply box must stay on screen
  if (await page.locator('.composer input').count()) {
    await page.setViewportSize({ width: w, height: Math.round(h * 0.55) });
    await page.evaluate(() => document.documentElement.style.setProperty('--app-h', `${window.innerHeight}px`));
    await page.waitForTimeout(300);
    const box = await page.locator('.composer').boundingBox();
    if (!box || box.y + box.height > Math.round(h * 0.55) + 1) problems.push(`${tag}-keyboard: reply box hidden under the keyboard`);
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(() => document.documentElement.style.removeProperty('--app-h'));
  }
  // gallery viewer, zoomed
  await page.click('.homebar');
  await page.locator('.app-icon', { hasText: '사진' }).click();
  await page.getByText('최근 항목').click();
  await page.locator('.thumb').first().click();
  await page.waitForTimeout(700);
  await audit(page, `${tag}-viewer`);
  // browser article, settings
  await page.click('.homebar');
  await page.locator('.app-icon', { hasText: '인터넷' }).click();
  await page.locator('.bm').nth(1).click();
  await page.waitForTimeout(500);
  await audit(page, `${tag}-article`);
  await page.click('.homebar');
  await page.locator('.app-icon', { hasText: '설정' }).click();
  await audit(page, `${tag}-settings`);
  // chapter 4 index app, then 02:00 all the way to the choice
  await debugClick(page, /^CH4$/);
  await page.locator('.dbg button', { hasText: '—' }).click();
  await page.waitForTimeout(4500);
  await page.click('.homebar');
  await page.locator('.app-icon', { hasText: '야간 색인' }).click();
  await audit(page, `${tag}-index`);
  await debugClick(page, /^02:00$/);
  await page.locator('.dbg button', { hasText: '—' }).click();
  await page.waitForTimeout(2600);
  await audit(page, `${tag}-finale-flood`);
  await page.waitForSelector('.final-choices', { timeout: 60000 });
  await page.waitForTimeout(800);
  await audit(page, `${tag}-finale-choice`);
  for (const e of ['poweroff', 'shift', 'release']) {
    await debugClick(page, `END ${e}`);
    await page.locator('.dbg button', { hasText: '—' }).click();
    await page.waitForSelector('.ending-card', { timeout: 30000 });
    await audit(page, `${tag}-ending-${e}`);
  }
  for (const e of errors) problems.push(`${tag}: console — ${e}`);
  await ctx.close();
}

// Landscape phone: the rotate note covers everything.
{
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.waitForTimeout(800);
  if (!(await page.locator('.rotate-note').isVisible())) problems.push('landscape: rotate note not shown');
  await page.screenshot({ path: `${OUT}/landscape.png` });
  await ctx.close();
}

await browser.close();
if (problems.length) {
  console.log(problems.join('\n'));
  console.log(`\n${problems.length} layout problem(s)`);
  process.exit(1);
}
console.log('layout OK at ' + SIZES.map(([w, h]) => `${w}×${h}`).join(', ') + ' + landscape');
