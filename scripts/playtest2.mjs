// Automated playthrough of season 2 「귀가」 on a phone-sized screen: from the
// season-1 ending card into season 2, through all three of its endings.
// Screenshots every beat, fails on any console error.
//
//   npm run build && npx vite preview --port 4173 &
//   node scripts/playtest2.mjs
// Env: QA_URL, CHROMIUM, SPEED (director speed multiplier, default 4)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.QA_URL ?? 'http://localhost:4173/';
const SPEED = Number(process.env.SPEED ?? 4);
const OUT = 'qa-output/playtest2';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const t0 = Date.now();
const results = [];
let shot = 0;
const mark = (label) => console.log(`${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s  ${label}`);
function check(name, ok, detail = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}
const snap = (name) => page.screenshot({ path: `${OUT}/${String(++shot).padStart(2, '0')}-${name}.png` });
const wait = (ms) => page.waitForTimeout(ms);
const save = () => page.evaluate(() => window.__game.getState().save);
const setRt = (patch) => page.evaluate((p) => window.__game.setRt(p), patch);
/** Wait for a condition on the game state, answering nothing on the way. */
async function until(fn, ms = 120000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await page.evaluate(fn)) return true;
    await wait(250);
  }
  return false;
}
const openApp = (app, thread = null) => setRt({ app, thread, chapterCard: null });
const key = (d) => page.locator('.keypad .key', { hasText: new RegExp(`^${d}$`) }).first().click();

// ── from a season-1 ending into season 2 ───────────────────────────────
await page.goto(`${BASE}?debug=1&speed=${SPEED}`);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.evaluate(() => window.__game.setSave({ started: true, playerName: '테스터', endings: ['release'], lastEnding: 'release' }));
await page.evaluate(() => window.__game.setRt({ ending: 'release' }));
await page.waitForSelector('.ending-card', { timeout: 40000 });
await snap('s1-ending-card');
await page.getByText('시즌 2 「귀가」').click();
await page.waitForSelector('.co-go');
check('season 2 starts from the season-1 ending card', (await page.textContent('.coldopen')).includes('시즌 2'));
await snap('coldopen-s2');
await page.click('.co-go');
await page.click('.co-skip');
await page.waitForSelector('.coldopen-actions.show');
await page.click('.coldopen-actions .primary');
await page.waitForSelector('.co-push');
await page.click('.co-push');
check('the door does not close this time', (await page.textContent('.co-shut')).includes('닫히지 않는다'));
await page.waitForSelector('.lock', { timeout: 6000 });
await wait(3500);
await snap('lock');
check('lock screen: the passcode clue (1994년 3월 14일) is on it', (await page.textContent('.lock')).includes('1994년 3월 14일'));
mark('lock');

// ── 0314 ───────────────────────────────────────────────────────────────
await page.click('.lock-main');
for (const d of '0314') await key(d);
check('0314 unlocks 소연\'s phone', await until(() => window.__game.getState().save.unlocked, 5000));
await until(() => window.__game.getState().save.chapter === 1, 10000);
await wait(3600);
await snap('home');
check('the home screen says whose phone it is', (await page.textContent('.home-dock-hint')).includes('소연'));

// ── the letter, the notebook ───────────────────────────────────────────
await openApp('notes');
await wait(300);
await page.locator('.note-list button').first().click();
await wait(500);
check('the letter to whoever picks up the phone is on top', (await page.textContent('.note-body')).includes('이 폰을 주운 사람에게'));
await snap('letter');
await openApp('gallery');
await wait(300);
await page.getByText('노트', { exact: true }).first().click();
await page.locator('.thumb').nth(2).click();
await wait(500);
await snap('tonight-page');
check('tonight\'s page: one more line appears while you look', await until(() => window.__game.getState().save.flags.includes('s2-n3-more'), 20000));
await wait(2200);
await snap('tonight-page-more');
mark('notebook');

// ── chapter 2: the recording ───────────────────────────────────────────
await until(() => window.__game.getState().save.memos.includes('s2m1'), 40000);
await openApp('memos');
await wait(400);
await page.locator('.memo-list button').first().click();
await page.locator('.memo-play').click();
await wait(12000);
await snap('memo');
check('the recording plays her mother\'s line', (await page.textContent('.memo-transcript')).includes('엄마'));
await until(() => window.__game.getState().save.choice?.id === 's2c2', 60000);
await openApp('messages', 'unknown');
await wait(500);
await snap('asks-name');
await page.getByText('이름을 알려 준다').click();
await page.fill('.name-form input', '테스터');
await page.locator('.name-form button').first().click();
mark('name');

// ── chapter 3: the admin page ──────────────────────────────────────────
check('보관소 관리 is installed', await until(() => window.__game.getState().save.installed.includes('index'), 40000));
await openApp('index');
await wait(400);
for (const d of '0928') await key(d);
await wait(800);
await snap('admin');
const admin = await page.textContent('.admin');
check('admin: the waiting list puts 소연 first and you last', admin.includes('한소연') && admin.includes('지금 이 페이지를 보는 사람'));
await page.getByText('“두 시 전에…”').click();
await page.getByText('다른 사람이 대신 삭제 요청').click();
await page.fill('#first', '엄마가 두시 전에는 집에 오라고 했잖아');
await page.getByRole('button', { name: '요청' }).click();
await wait(300);
check('her mother\'s text (the trap) is refused, and told apart', (await page.textContent('.admin')).includes('엄마가 오늘 한 말'));
await page.getByText('기록 003 (실종 신고) 다시 보기').click();
check('record 003 can be reread right in the form', (await page.textContent('.admin')).includes('신고자: 딸'));
// "2시" for "두 시" is fine
await page.fill('#first', '엄마가 2시 전에는 온다고 했어요');
await page.getByRole('button', { name: '요청' }).click();
check('the first sentence (record 003) arms the deletion for 02:00', await until(() => window.__game.getState().save.flags.includes('copy-armed'), 5000));
await snap('admin-armed');
await openApp('browser');
await wait(300);
await page.getByText('심야 기록보관소').first().click();
await page.getByRole('button', { name: /기록 003/ }).click();
await wait(400);
check('record 003 still has the sentence (the informant, age 11)', (await page.textContent('.arc-page-wrap')).includes('엄마가 두 시 전에는 온다고 했어요'));
mark('admin');
// 소연's recording from the gate, then the cassette she never finished
await openApp('memos');
await wait(400);
check('소연\'s 22:47 recording is on the list', (await page.textContent('.memo-list')).includes('9월 27일 22:47'));
await page.locator('.memo-list button', { hasText: '9월 27일 22:47' }).click();
await page.locator('.memo-play').click();
await wait(8000);
await snap('soyeon-memo');
check('…and plays in her own words', (await page.textContent('.memo-transcript')).includes('한소연이에요'));
await page.evaluate(() => window.__game.emit('memo:s2m2:end'));
check('the 1994 cassette becomes playable', await until(() => window.__game.getState().save.flags.includes('tape-ok'), 20000));

// ── chapter 4: 엄마 calls, the note writes itself ───────────────────────
check('chapter 4 arrives', await until(() => window.__game.getState().save.chapter === 4, 120000));
await setRt({ chapterCard: null, app: null });
await page.evaluate(() => window.__game.setSpeed(1));
await until(() => window.__game.getState().rt.incoming === 'eomma', 90000);
await snap('eomma-calls');
await page.locator('.accept').dispatchEvent('click');
await page.waitForSelector('.call-choices', { timeout: 15000 });
await snap('eomma-choice');
await page.getByText('소연 씨 폰을 주운 사람이에요.').click();
await until(() => !window.__game.getState().rt.activeCall, 40000);
check('the note writes itself: 02:00 — 한', await until(() => (window.__game.getState().save.liveNote ?? '').startsWith('02:00 — 한'), 40000));
check('the phone in the booth photographed the kitchen at 01:52', (await save()).photos.includes('s2-kitchen2'));
await openApp('notes');
await wait(400);
await page.locator('.note-list button').first().click();
await wait(800);
await snap('live-note');
await until(() => window.__game.getState().save.choice?.id === 's2c5', 60000);
await openApp('messages', 'self');
await wait(400);
await snap('soyeon-inside');
await page.getByText('정말 남으실 거예요?').click();
check('02:00 arrives', await until(() => window.__game.getState().rt.finale, 120000));
await page.waitForSelector('.final-choices', { timeout: 60000 });
await snap('final-choices');
mark('02:00');

// ── the three endings ──────────────────────────────────────────────────
const endings = [];
async function ending(label, act) {
  await page.waitForSelector('.final-choices', { timeout: 60000 });
  await act();
  await page.waitForSelector('.ending-card', { timeout: 60000 });
  await wait(600);
  await snap(`ending-${label}`);
  endings.push(await page.textContent('.ending-card h2'));
  mark(`ENDING — ${label}`);
}
await ending('daughter', () => page.getByText('지켜본다').click());
await page.getByText('02:00부터 다시').click();
await ending('instead', async () => {
  await page.getByText('내 이름을 쓴다').click();
  await page.locator('#s2n').fill('테스터');
  await page.getByRole('button', { name: '쓴다' }).click();
});
check('ending 5 says the name you wrote', (await page.textContent('.ending-scene')).includes('테스터'));
await page.getByText('02:00부터 다시').click();
await ending('home', async () => {
  await page.getByText('사본을 지운다').click();
  await page.getByRole('button', { name: '지운다' }).click();
});
check('ending 6: her last line', (await page.textContent('.ending-scene')).includes('소연아 엄마 왔다 간다'));
const final = await save();
check('all three season-2 endings recorded', ['s2-daughter', 's2-instead', 's2-home'].every((e) => final.endings.includes(e)), final.endings.join(','));
check('season 1 endings are kept', final.endings.includes('release'));
check('no console errors', errors.length === 0, errors.join(' | '));

await browser.close();
const failed = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
