// Automated playthrough of 새벽 2시의 휴대폰 on a phone-sized screen.
// Plays like a player (taps, types, waits), screenshots every beat, logs
// timings and fails on any console error.
//
//   npm run build && npx vite preview --port 4173 &
//   node scripts/playtest.mjs            # full true-ending run + other endings
// Env: QA_URL, CHROMIUM, SPEED (director speed multiplier, default 4)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.QA_URL ?? 'http://localhost:4173/';
const SPEED = Number(process.env.SPEED ?? 4);
const OUT = 'qa-output/playtest';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const t0 = Date.now();
const log = [];
let shot = 0;
const results = [];
function mark(label) {
  const s = ((Date.now() - t0) / 1000).toFixed(1);
  log.push(`${s.padStart(6)}s  ${label}`);
  console.log(`${s.padStart(6)}s  ${label}`);
}
function check(name, ok, detail = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}
const snap = async (name) => page.screenshot({ path: `${OUT}/${String(++shot).padStart(2, '0')}-${name}.png` });
const wait = (ms) => page.waitForTimeout(ms);
const tap = (sel) => page.locator(sel).first().click();
const tapText = (text) => page.getByText(text, { exact: false }).first().click();
const home = () => tap('.homebar');
const save = () => page.evaluate(() => window.__game.getState().save);
const waitFor = (sel, timeout = 30000) => page.waitForSelector(sel, { timeout });

async function openApp(name) {
  await home();
  await wait(300);
  await page.locator('.app-icon', { hasText: name }).first().click();
  await wait(400);
}
async function openThread(name) {
  await openApp('메시지');
  await page.locator('.thread-row', { hasText: name }).first().click();
  await wait(500);
}
// ── Cold open ───────────────────────────────────────────────────────────
await page.goto(`${BASE}?debug=1&speed=${SPEED}`);
await waitFor('.coldopen');
await wait(2500);
await snap('coldopen');
await waitFor('.coldopen-actions.show', 12000);
mark('cold open finished typing');
await tapText('소리 없이 집는다');

// ── Lock ───────────────────────────────────────────────────────────────
await waitFor('.lock');
await wait(800);
await snap('lock');
check('lock screen shows the passcode hint', (await page.textContent('.lock')).includes('들어간 시각'));
await tap('.lock-main');
for (const d of '0000') await page.locator('.keypad .key', { hasText: d }).first().click();
await wait(500);
check('wrong passcode is rejected', !(await save()).unlocked);
for (const d of '0113') await page.locator('.keypad .key', { hasText: new RegExp(`^${d}$`) }).first().click();
await waitFor('.chapter-card');
mark('unlocked (CH1)');
await snap('chapter1');
await wait(3200);
await snap('home');

// ── CH1: the unknown number ─────────────────────────────────────────────
await openThread('02:00');
await snap('unknown-thread');
await waitFor('.choices', 20000);
mark('first choice offered');
await snap('choice-1');
await tapText('누구세요?');
await page.waitForFunction(() => window.__game.getState().save.flags.includes('asked-photo'), null, { timeout: 30000 });
mark('asked to look at the last photo');
await snap('unknown-asks-photo');

await openThread('도현');
await wait(600);
await snap('dohyun-history');

await openApp('사진');
await tapText('최근 항목');
await wait(400);
await snap('gallery-grid');
await page.locator('.thumb').last().click();
await wait(2500);
await snap('black-photo');
await tapText('편집');
for (const v of [0.3, 0.6, 0.8]) {
  await page.evaluate((val) => {
    const el = document.querySelector('#bright');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, String(val));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, v);
  await wait(500);
}
await snap('brightness-80');
await page.evaluate(() => {
  const el = document.querySelector('#bright');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, '1');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await waitFor('.scare-lunge', 5000);
mark('SCARE 1 — the black photo');
await wait(250);
await snap('scare-photo');

// ── CH2: 도현 calls ─────────────────────────────────────────────────────
await waitFor('.incoming', 30000);
mark('incoming call');
await snap('incoming-call');
await page.locator('.accept').first().click({ force: true });
await waitFor('.call-choices', 20000);
await snap('call-choice');
await tapText('주운 사람이에요');
await wait(12000);
await snap('call-subtitles');
await page.waitForSelector('.callscreen', { state: 'detached', timeout: 30000 });
mark('call ended (CH2)');
await wait(3500);

await openApp('녹음');
await tapText('새 녹음 17');
await tap('.memo-play');
await wait(30000);
await snap('memo-subtitle');
await wait(14500);
await snap('memo-scream');
await page.waitForFunction(() => window.__game.getState().save.flags.includes('memo-done'), null, { timeout: 15000 });
mark('memo finished');

await openThread('02:00');
await waitFor('.choices', 30000);
await snap('asks-name');
await tapText('이름을 알려 준다');
await page.fill('.name-form input', '테스터');
await tap('.name-form button');
await page.waitForFunction(() => window.__game.getState().save.threads.unknown.some((m) => m.text.includes('1340')), null, { timeout: 30000 });
mark('got the album code (CH3)');
await snap('name-used');
await wait(3500);

// ── CH3: hidden album ───────────────────────────────────────────────────
await openApp('사진');
await tapText('숨김');
await wait(300);
for (const d of '1340') await page.locator('.keypad .key', { hasText: new RegExp(`^${d}$`) }).first().click();
await wait(700);
await snap('hidden-album');
await page.locator('.thumb').first().click();
await wait(600);
for (let i = 0; i < 4; i++) {
  await snap(`hidden-${i + 1}`);
  await page.getByLabel('다음 사진').click();
  await wait(900);
}
await waitFor('.scare-lunge', 6000);
mark('SCARE 2 — the selfie');
await wait(250);
await snap('scare-selfie');
await page.waitForFunction(() => window.__game.getState().save.threads.self.some((m) => m.text.includes('추워')), null, { timeout: 30000 });
await wait(600);
await snap('self-message-banner');

await openThread('나에게');
await waitFor('.choices', 20000);
await tapText('채원 씨예요?');
await page.waitForFunction(() => window.__game.getState().save.threads.self.some((m) => m.text.includes('메모에')), null, { timeout: 40000 });
mark('채원 asked for help');
await snap('chaewon-inside');

// ── archive puzzle ──────────────────────────────────────────────────────
await openApp('인터넷');
await tapText('심야 기록보관소');
await wait(400);
await snap('archive-index');
for (const r of ['기록 001', '기록 003', '기록 007']) {
  await page.locator('.archive li button', { hasText: r }).first().click();
  await wait(700);
  if (r === '기록 003') await snap('archive-003');
  await tap('.back');
  await wait(300);
}
await waitFor('.archive li button.new', 5000);
check('record 013 appears after the broadcast order', true);
await page.locator('.archive li button.new').click();
await wait(600);
await snap('archive-013-key');
mark('found the key → CH4');

// ── CH4 ────────────────────────────────────────────────────────────────
await waitFor('.chapter-card', 15000);
await wait(3500);
await home();
await wait(800);
await snap('ch4-home-shuffled');
check('야간 색인 app installed', (await page.locator('.app-icon', { hasText: '야간 색인' }).count()) === 1);
await openApp('설정');
await tapText('전원 끄기');
await wait(500);
await snap('power-blocked');
await tapText('확인');
await openApp('메모');
await wait(300);
await snap('note-n4');

// ── 02:00 ──────────────────────────────────────────────────────────────
await waitFor('.finale', 90000);
mark('02:00 — finale');
await wait(2600);
await snap('finale-flood');
await wait(3500);
await snap('finale-strip');
await waitFor('.finale-ring .incoming, .finale .incoming', 15000);
await snap('finale-ring');
await waitFor('.video-call', 12000);
await wait(4500);
await snap('finale-video');
await waitFor('.finale .scare-lunge', 12000);
mark('SCARE 3 — the video call');
await wait(200);
await snap('finale-scare');
await waitFor('.final-choices', 40000);
await snap('final-choices');
await tapText('연장 열쇠를 입력한다');
await page.fill('#fk', 'HAEWON-0200');
await tapText('입력');
await page.fill('#fn', '서미령');
await tapText('입력');
await waitFor('.ending-release', 10000);
mark('ENDING 3 — 색인 종료');
await waitFor('.ending-card', 20000);
await snap('ending-release');

// ── other endings via debug jump ────────────────────────────────────────
for (const [label, pick, cls] of [
  ['전원을 끈다', '전원을 끈다', 'poweroff'],
  ['내가 남는다', '내가 남는다', 'shift'],
]) {
  await page.getByText('처음부터 다시 하기').click();
  await wait(500);
  await page.evaluate(() => document.querySelector('.dbg-fab')?.click());
  await page.getByRole('button', { name: '02:00', exact: true }).click();
  await page.evaluate(() => document.querySelector('.dbg .dbg-row button')?.click());
  await waitFor('.final-choices', 60000);
  await tapText(pick);
  await waitFor(`.ending-${cls}`, 10000);
  await waitFor('.ending-card', 20000);
  mark(`ENDING — ${label}`);
  await snap(`ending-${cls}`);
}

const final = await save();
check('all three endings recorded', final.endings.length === 3, final.endings.join(','));
check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log('\n' + log.join('\n'));
const failed = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
