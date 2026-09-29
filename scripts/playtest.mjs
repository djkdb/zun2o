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
await tap('.coldopen-actions .primary');

// ── Lock ───────────────────────────────────────────────────────────────
await waitFor('.lock');
await wait(800);
await snap('lock');
check('lock screen shows the passcode hint', (await page.textContent('.lock')).includes('촬영을 시작한 시각') && (await page.textContent('.lock')).includes('01:13에 시작한'));
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
await openThread('모르는 번호');
await snap('unknown-thread');
await waitFor('.choices', 20000);
mark('first choice offered');
await snap('choice-1');
await tapText('누구세요?');
await page.waitForFunction(() => window.__game.getState().save.flags.includes('asked-photo'), null, { timeout: 30000 });
mark('asked to look at the last photo');
await snap('unknown-asks-photo');
// the player can always type back — and gets answered
check('chat always has a reply box', (await page.locator('.composer input').count()) === 1);
await page.fill('.composer input', '당신 누구야?');
await page.press('.composer input', 'Enter');
await page.waitForFunction(() => window.__game.getState().save.threads.unknown.some((m) => m.text.includes('정말 몰라요')), null, { timeout: 25000 });
check('free-text message gets an in-character reply', true);
// asked again, the answer changes: the conversation remembers
await wait(4500);
await page.fill('.composer input', '누구냐고');
await page.press('.composer input', 'Enter');
await page.waitForFunction(() => window.__game.getState().save.threads.unknown.some((m) => m.text.includes('기록하는 사람이요')), null, { timeout: 25000 });
check('asking twice gets a different answer', true);
await snap('free-text-reply');
// the shared photo card opens that exact photo
await page.locator('.attach-photo').last().click();
await wait(800);
check('photo card in chat opens the photo', (await page.locator('.viewer .edit-btn').count()) === 1);
await snap('attach-opens-photo');

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

await openThread('모르는 번호');
await waitFor('.choices', 30000);
await snap('asks-name');
await tapText('이름을 알려 준다');
await page.fill('.name-form input', '테스터');
await tap('.name-form button');
await page.waitForFunction(() => window.__game.getState().save.threads.unknown.some((m) => m.text.includes('방송이에요')), null, { timeout: 30000 });
mark('entity hints at the album code (CH3)');
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
// the phone restarts by itself and comes back locked — with you as the wallpaper
await waitFor('.reboot', 90000);
mark('phone rebooted itself');
await wait(900);
await snap('reboot');
await waitFor('.lock', 20000);
await wait(1200);
await snap('lock-new-wallpaper');
check('after the reboot the wallpaper is the booth photo', (await page.locator('.lock-wall.changed').count()) === 1);
await tap('.lock-main');
for (const d of '0113') await page.locator('.keypad .key', { hasText: new RegExp(`^${d}$`) }).first().click();
await wait(800);

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
// Chapter 4 is a real-time countdown: play it at 1× like a person would.
await page.evaluate(() => window.__game.setSpeed(1));
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
await page.locator('.dialog button').first().click({ force: true });
await page.waitForFunction(() => window.__game.getState().save.memos.includes('m2'), null, { timeout: 60000 });
await openApp('녹음');
check('memo 18 (the phone recorded you) appears', (await page.locator('.memo-list', { hasText: '새 녹음 18' }).count()) === 1);
const dismissDialog = async (name) => {
  if (await page.locator('.dialog').count()) {
    if (name) await snap(name);
    await page.locator('.dialog button').first().click({ force: true });
    await wait(400);
    return true;
  }
  return false;
};
// Chapter 4 runs on a clock: pop-ups can land at any moment. Deal with them like a player would.
const calmClick = async (locator) => {
  for (let i = 0; i < 12; i++) {
    await dismissDialog(i === 0 ? 'ch4-dialog' : undefined);
    await page.waitForSelector('.banner', { state: 'detached', timeout: 5000 }).catch(() => undefined);
    try {
      await locator.first().click({ timeout: 2500 });
      return;
    } catch {
      /* something slid in front; try again */
    }
  }
  await snap('calm-fail');
  throw new Error(`could not click through chapter 4 pop-ups: ${locator}`);
};
await calmClick(page.locator('.memo-list button', { hasText: '새 녹음 18' }));
await calmClick(page.locator('.memo-play'));
await wait(6000);
await snap('memo18');
const calmOpen = async (name) => {
  await calmClick(page.locator('.homebar'));
  await wait(300);
  await calmClick(page.locator('.app-icon', { hasText: name }));
  await wait(400);
};
await calmOpen('사진');
await calmClick(page.getByText('최근 항목'));
await wait(400);
await snap('gallery-autobackup');
// zoom into the auto-backup photo: double-tap
await calmClick(page.locator('.thumb', { hasText: '01:39' }));
await wait(500);
const img = page.locator('.viewer-img');
await img.click();
await wait(120);
await img.click();
await wait(700);
check('double-tap zooms into a photo', (await page.locator('.viewer-img.zoomed').count()) === 1);
await snap('zoom-p08');
await calmClick(page.locator('.back'));
await wait(300);
// the rest of chapter 4 happens on its own clock: battery warning, then 도현's call
await page.waitForFunction(() => document.querySelector('.incoming, .dialog, .finale'), null, { timeout: 90000 });
await dismissDialog('ch4-battery-dialog');
await page.waitForFunction(() => document.querySelector('.incoming, .finale'), null, { timeout: 90000 });
if (await page.locator('.incoming').count()) {
  mark('01:57 call');
  await snap('ch4-call');
  await page.locator('.accept').first().click({ force: true });
  await wait(12000);
  await snap('ch4-call-voice');
}

await page.evaluate((x) => window.__game.setSpeed(x), SPEED);
// ── 02:00 ──────────────────────────────────────────────────────────────
await waitFor('.finale', 90000);
mark('02:00 — finale');
// closing the app at 02:00 does not get you out of it
await wait(1200);
await page.reload();
await waitFor('.finale', 15000);
check('reload during 02:00 resumes the finale', true);
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
for (const [label, cls] of [
  ['전원 끄기 (슬라이드)', 'poweroff'],
  ['내가 남는다 (서명)', 'shift'],
]) {
  // The checkpoint lets you replay 02:00 for the other endings.
  await page.getByText('02:00부터 다시').click();
  await waitFor('.final-choices', 60000);
  if (cls === 'poweroff') {
    await page.evaluate(() => {
      const el = document.querySelector('.power-slider input');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, '1');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
  } else {
    await tapText('내가 남는다');
    await page.fill('#fs', '테스터');
    await tapText('서명한다');
  }
  await waitFor(`.ending-${cls}`, 10000);
  await waitFor('.ending-card', 20000);
  mark(`ENDING — ${label}`);
  await snap(`ending-${cls}`);
}

// ── Regression: exploits found by the playtester ────────────────────────
await page.getByText('처음부터 다시 하기').click();
await waitFor('.coldopen-actions.show', 15000);
await tap('.coldopen-actions .primary');
await waitFor('.lock');
await tap('.lock-main');
for (const d of '0113') await page.locator('.keypad .key', { hasText: new RegExp(`^${d}$`) }).first().click();
await waitFor('.chapter-card');
await wait(3300);
// 0) hint tiers: the app glows first, then the chip (goal + where), the full hint only on request
await page.evaluate(() => window.__game.setSave((s) => ({ objective: { ...s.objective, since: Date.now() - 140000 } })));
await page.waitForSelector('.app-icon.hint-glow', { timeout: 8000 });
check('hint tier 2: the related app glows', (await page.locator('.app-icon.hint-glow', { hasText: '메시지' }).count()) === 1);
await page.evaluate(() => window.__game.setSave((s) => ({ objective: { ...s.objective, since: Date.now() - 200000 } })));
await page.waitForSelector('.hint-chip', { timeout: 8000 });
await tap('.hint-chip');
const sheet = await page.textContent('.hint-sheet');
check('hint tier 3: goal and where to look, not the answer', sheet.includes('살펴볼 곳') && !sheet.includes('모르는 번호가 하나'));
await tap('.hint-more');
check('hint tier 4: full hint on request', (await page.textContent('.hint-sheet')).includes('모르는 번호가 하나'));
await snap('hint-tiers');
await tap('.hint-chip');
// 1) solving the archive puzzle from the notes in chapter 1 must not skip to chapter 4
await openApp('인터넷');
await tapText('심야 기록보관소');
for (const r of ['기록 001', '기록 003', '기록 007']) {
  await page.locator('.archive li button', { hasText: r }).first().click();
  await wait(1400);
  if (r === '기록 007') check('REGRESSION: early archive order says 013 is "being written"', (await page.textContent('.archive-page')).includes('작성 중'));
  await tap('.back');
  await wait(300);
}
const early = await save();
check('REGRESSION: early 013 is not indexed, chapters not skipped', (await page.locator('.archive li button.new').count()) === 0 && early.chapter === 1 && !early.flags.includes('ch4'), `chapter ${early.chapter}`);
// 1b) the hidden album code found early: album stays "syncing" until chapter 3
await openApp('사진');
await tapText('숨김');
for (const d of '1340') await page.locator('.keypad .key', { hasText: new RegExp(`^${d}$`) }).first().click();
await wait(800);
check('REGRESSION: early album code → syncing album, no selfie yet', (await page.locator('.thumb.syncing').count()) === 5 && !(await save()).flags.includes('album-open'));
await snap('album-syncing');
await tap('.back');
await wait(300);
await tap('.back');
await wait(300);
// 2) declining 도현 once must not also fire the "declined twice" branch
await openApp('사진');
await tapText('최근 항목');
await page.locator('.thumb', { hasText: '01:59' }).first().click();
await wait(400);
await tapText('편집');
await page.evaluate(() => {
  const el = document.querySelector('#bright');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, '1');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await waitFor('.incoming', 30000);
await page.locator('.decline').first().click({ force: true });
await wait(4000);
const afterDecline = (await save()).threads.dohyun.slice(-3).map((m) => m.text).join(' | ');
check('REGRESSION: one decline → one reaction', afterDecline.includes('받아 주세요') && !afterDecline.includes('그럼 이것만'), afterDecline);
// 3) hanging up on 도현 mid-call (or losing the page) must never strand the story
await waitFor('.incoming', 30000);
await page.locator('.accept').first().click({ force: true });
await wait(1500);
await page.locator('.hangup').first().click({ force: true });
await page.waitForFunction(() => window.__game.getState().save.threads.dohyun.some((m) => m.text.includes('끊겼어요')), null, { timeout: 15000 });
check('REGRESSION: hanging up on 도현 → he texts and calls back', true);
await page.reload();
await waitFor('.incoming', 30000);
check('REGRESSION: after a reload, the owed call rings again', true);
await page.locator('.accept').first().click({ force: true });
await wait(1500);
await page.locator('.hangup').first().click({ force: true });
await page.waitForFunction(() => window.__game.getState().save.flags.includes('call1-done'), null, { timeout: 30000 });
check('REGRESSION: second hang-up → texts instead, chapter 2 starts', (await save()).chapter === 2);

const final = await save();
check('all three endings recorded', ['release', 'poweroff', 'shift'].every((e) => final.endings.includes(e)), final.endings.join(','));
check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log('\n' + log.join('\n'));
const failed = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
