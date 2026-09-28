// End-to-end QA for THE NIGHT ARCHIVE.
// Usage: npm run build && npx vite preview --port 4173 &  then  npm run qa
// Env: QA_URL (default http://localhost:4173/), CHROMIUM (executable path).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.QA_URL ?? 'http://localhost:4173/';
const OUT = 'qa-output';
mkdirSync(OUT, { recursive: true });

const executablePath = process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath, args: ['--autoplay-policy=user-gesture-required'] });

const results = [];
let failures = 0;
function check(name, ok, detail = '') {
  const line = `${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`;
  results.push(line);
  console.log(line);
  if (!ok) failures++;
}

async function newPage(opts = {}, { skipGate = true } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  if (skipGate) await context.addInitScript(() => sessionStorage.setItem('na_entered', '1'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return { context, page, errors };
}

const readSave = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('night-archive:save') ?? 'null'));
const level = (page) => page.evaluate(() => document.documentElement.dataset.level);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Test K — entry warning: a first-time visitor is told what this is ──
{
  const { context, page, errors } = await newPage({}, { skipGate: false });
  await page.goto(BASE);
  await page.waitForSelector('.gate');
  const text = (await page.textContent('.gate')) ?? '';
  check('K first visit shows the entry warning (Korean)', text.includes('실제 시각') && text.includes('새벽 2시'));
  check('K warning explains what to do', text.includes('이상한 점') && text.includes('열람 수첩'));
  await page.screenshot({ path: `${OUT}/K-gate.png` });
  await page.click('.gate-btn:not(.primary)');
  await page.waitForSelector('.gate', { state: 'detached' });
  check('K entering removes the warning', (await page.locator('.gate').count()) === 0);
  check('K "소리 없이" turns sound off', (await page.locator('.tool-toggle').getAttribute('aria-pressed')) === 'false');
  check('K reading notes show a next hint', ((await page.textContent('.notes-hint')) ?? '').length > 10);
  await page.reload();
  await page.waitForSelector('.site-title');
  check('K warning is not repeated on reload', (await page.locator('.gate').count()) === 0);
  await page.screenshot({ path: `${OUT}/K-after-gate.png` });
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mp = await m.newPage();
  await mp.goto(BASE);
  await mp.waitForSelector('.gate');
  const btnBottom = await mp.evaluate(() => document.querySelector('.gate-btn.primary')?.getBoundingClientRect().bottom ?? 9999);
  check('K phone: entry buttons visible without scrolling', btnBottom < 844, `bottom ${Math.round(btnBottom)}`);
  await mp.screenshot({ path: `${OUT}/K-gate-mobile.png` });
  await mp.click('.gate-btn.primary');
  await mp.waitForSelector('.gate', { state: 'detached' });
  await mp.screenshot({ path: `${OUT}/K-mobile-index.png` });
  await m.close();
  check('K no JS errors', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ── Test A — first visit ────────────────────────────────────────────────
{
  const { context, page, errors } = await newPage();
  await page.goto(BASE);
  await page.waitForSelector('.record-list li');
  check('A1 first visit renders the archive', (await page.textContent('.site-title'))?.includes('심야 기록보관소'));
  check('A2 welcome line is "어서 오세요."', (await page.textContent('.welcome'))?.trim() === '어서 오세요.');
  const rows = await page.locator('.record-list li').count();
  check('A3 nine records listed', rows === 9, `${rows} rows`);
  const lv = await level(page);
  const hour = await page.evaluate(() => new Date().getHours());
  check('A4 level is normal outside 01:30–02:59', hour >= 1 && hour < 3 ? true : lv === '0', `level ${lv}`);
  check('A5 no debug panel in production mode', (await page.locator('.debug').count()) === 0);
  check('A6 no JS errors', errors.length === 0, errors.join(' | '));
  await page.screenshot({ path: `${OUT}/A-first-visit.png` });

  // ── Test C — memory ───────────────────────────────────────────────────
  await page.reload();
  await page.waitForSelector('.welcome');
  await wait(600);
  let save = await readSave(page);
  check('C1 reload keeps the same visit', save.visitCount === 1, `visitCount ${save.visitCount}`);
  const state = await context.storageState();
  await context.close();
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: state });
  await c2.addInitScript(() => sessionStorage.setItem('na_entered', '1'));
  const p2 = await c2.newPage();
  await p2.goto(BASE);
  await p2.waitForSelector('.welcome');
  await wait(600);
  save = await readSave(p2);
  check('C2 reopening the browser counts a new visit', save.visitCount === 2, `visitCount ${save.visitCount}`);
  check('C3 site remembers you ("다시 오셨네요.")', (await p2.textContent('.welcome'))?.trim() === '다시 오셨네요.');
  await c2.close();
}

// ── Test B — time escalation (debug clock) ──────────────────────────────
{
  const { context, page, errors } = await newPage();
  const expected = [
    ['12:00', '0'],
    ['01:30', '1'],
    ['01:45', '2'],
    ['01:55', '3'],
    ['01:59', '4'],
  ];
  for (const [t, lv] of expected) {
    await page.goto(`${BASE}?debug=true&t=${t}#/`);
    await page.waitForSelector('.debug');
    await wait(1300);
    const got = await level(page);
    check(`B level at ${t} is ${lv}`, got === lv, `got ${got}`);
    await page.screenshot({ path: `${OUT}/B-${t.replace(':', '')}.png` });
  }
  // 01:59:56 → cross into 02:00 naturally
  await page.goto(`${BASE}?debug=true&t=01:59:56#/`);
  await page.waitForSelector('.clock-time');
  await page.screenshot({ path: `${OUT}/B-015956-threshold.png` });
  await wait(6500);
  const stage1 = await page.evaluate(() => document.querySelector('.debug-stats')?.textContent ?? '');
  check('B main event starts on its own at 02:00:00', /MAIN EVENT(freeze|silence|fade|retitle)/.test(stage1), stage1.match(/MAIN EVENT\w+/)?.[0]);
  check('B clock freezes at 02:00:00', (await page.textContent('.clock-time'))?.trim() === '02:00:00');
  await wait(5000);
  await page.screenshot({ path: `${OUT}/B-event-fade.png` });
  await wait(5500);
  const gone = await page.locator('.nav li.gone').count();
  check('B menu items vanish one by one', gone >= 2, `${gone} gone`);
  await page.screenshot({ path: `${OUT}/B-event-strip.png` });
  await wait(6000);
  check('B a record types itself in the dark', (await page.textContent('.event-record'))?.includes('방문자 기록'));
  await page.screenshot({ path: `${OUT}/B-event-record.png` });
  await wait(6500);
  await page.screenshot({ path: `${OUT}/B-event-recall.png` });
  const scared = await page.waitForSelector('.scare-lunge', { timeout: 8000 }).then(() => true, () => false);
  check('B 02:00 climax: she comes out of the photograph (jump scare)', scared);
  await wait(250);
  await page.screenshot({ path: `${OUT}/B-event-scare.png` });
  await page.waitForURL(/#\/record\/009/, { timeout: 10000 }).catch(() => null);
  await page
    .waitForFunction(() => document.querySelector('.debug-stats')?.textContent?.includes('MAIN EVENTdone'), null, { timeout: 12000 })
    .catch(() => null);
  await wait(700);
  check('B event ends on Record 009', page.url().includes('#/record/009'), page.url());
  check('B site is now in UNKNOWN mode', (await level(page)) === '5');
  check('B nav shows UNKNOWN', (await page.locator('.nav li.unknown').count()) === 1);
  await wait(600);
  const save = await readSave(page);
  check('B secret C found by witnessing 02:00', save.secretProgress.C.found === true);
  check('B event remembered for tonight', save.mainEventNights.length === 1 && save.flags.includes('saw-main-event'));
  await page.screenshot({ path: `${OUT}/B-after-0200.png`, fullPage: true });
  check('B no JS errors during event', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ── Test D/E — secrets and all endings ──────────────────────────────────
{
  const { context, page, errors } = await newPage();
  await page.goto(`${BASE}?debug=true&t=12:00#/`);
  await page.waitForSelector('.debug');
  // First-visit anomaly: hovering record 007 (probabilistic → hover a few times).
  // Secret A
  for (const id of ['001', '003', '007']) {
    await page.goto(`${BASE}#/record/${id}`);
    await page.waitForSelector('.record-title');
  }
  await page.waitForSelector('.toast', { timeout: 5000 }).catch(() => null);
  check('D-A 013 is indexed after the broadcast order', (await page.textContent('.toast'))?.includes('기록 013') ?? false);
  await page.goto(`${BASE}#/records`);
  check('D-A 013 appears in the index', (await page.locator('[data-record="013"]').count()) >= 1);
  await page.goto(`${BASE}#/record/013`);
  await page.waitForSelector('.record-title');
  await wait(600);
  let save = await readSave(page);
  check('D-A secret A found', save.secretProgress.A.found);
  await page.goto(`${BASE}#/unknown`);
  check('D record 017 pending before 02:00', (await page.textContent('main'))?.includes('지금은 02:00이 아닙니다'));

  // Secret B
  await page.goto(`${BASE}#/system`);
  check('D-B /system is a 404 before the sentence', (await page.locator('.not-found').count()) === 1);
  await page.goto(`${BASE}#/record/003`);
  await page.click('.secret-sentence button');
  await page.click('.secret-sentence a[href="#/system"]');
  await page.waitForSelector('.terminal-choices button', { timeout: 15000 });
  await page.screenshot({ path: `${OUT}/D-terminal-choice.png` });
  await page.click('.terminal-choices button >> text=[Y]');
  await page.waitForSelector('#cmd:not([disabled])', { timeout: 20000 });
  await wait(600);
  save = await readSave(page);
  check('D-B secret B found via terminal', save.secretProgress.B.found);
  await page.fill('#cmd', 'help');
  await page.press('#cmd', 'Enter');
  await wait(2500);
  check('D-B terminal responds to HELP', (await page.textContent('.terminal-screen'))?.includes('명령어'));
  await page.screenshot({ path: `${OUT}/D-terminal.png` });

  // Secret D
  await page.goto(`${BASE}#/search`);
  await page.fill('#q', 'room');
  await page.press('#q', 'Enter');
  check('D-D ROOM_02 hidden at level 0', (await page.locator('.search-results .corrupted').count()) === 0);
  await page.click('.debug button:text-is("L2")');
  await page.fill('#q', 'room');
  await page.press('#q', 'Enter');
  await page.waitForSelector('.search-results .corrupted a');
  await page.click('.search-results .corrupted a');
  await page.waitForSelector('[data-scene="room-02"]');
  await wait(600);
  save = await readSave(page);
  check('D-D secret D found via search', save.secretProgress.D.found);
  await page.click('.debug button:text-is("auto")');

  // Secret ending via terminal key
  await page.goto(`${BASE}#/system`);
  await page.waitForSelector('.terminal-choices button', { timeout: 15000 });
  await page.click('.terminal-choices button >> text=[N]');
  await page.waitForSelector('#cmd:not([disabled])', { timeout: 20000 });
  await page.fill('#cmd', 'key HAEWON-0200');
  await page.press('#cmd', 'Enter');
  await page.waitForURL(/#\/ending\/secret/, { timeout: 15000 });
  await wait(9000);
  check('E secret ending reached', (await page.textContent('.ending-title'))?.includes('색인'));
  await page.screenshot({ path: `${OUT}/E-ending-secret.png` });

  // True ending: 02:00, A+B+C
  await page.goto(`${BASE}#/`);
  await page.click('.debug button:text-is("Trigger 02:00")');
  await page.click('.event-skip');
  await page.waitForURL(/#\/record\/009/);
  await page.waitForSelector('.visitor-log');
  await wait(600);
  save = await readSave(page);
  check('E secret C found at 02:00', save.secretProgress.C.found);
  await page.goto(`${BASE}#/unknown`);
  await page.waitForSelector('.accept-shift button');
  await page.screenshot({ path: `${OUT}/E-record-017.png` });
  await page.click('.accept-shift button');
  await page.waitForURL(/#\/ending\/true/, { timeout: 10000 });
  await wait(12000);
  check('E true ending reached', (await page.textContent('.ending-title'))?.includes('야간 근무'));
  await page.screenshot({ path: `${OUT}/E-ending-true.png` });
  await page.click('.ending-page a.btn');
  await wait(1500);
  check('E after the true ending the archive is calm', Number(await level(page)) <= 1, `level ${await level(page)}`);
  check('E the archive greets you as archivist', (await page.textContent('.welcome'))?.includes('기록사'));

  // Normal ending via contact
  await page.goto(`${BASE}#/contact`);
  await page.click('button:text-is("퇴실하기")');
  await page.click('button:text-is("네, 퇴실합니다")');
  await page.waitForURL(/#\/ending\/normal/);
  await wait(9000);
  check('E normal ending reached', (await page.textContent('.ending-title'))?.includes('퇴실 처리'));
  await page.screenshot({ path: `${OUT}/E-ending-normal.png` });
  save = await readSave(page);
  check('E all three endings recorded', save.endingUnlocked.length === 3, save.endingUnlocked.join(','));
  check('D/E no JS errors', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ── Test F — responsive ─────────────────────────────────────────────────
for (const [w, h] of [
  [375, 812],
  [430, 932],
  [768, 1024],
  [1920, 1080],
]) {
  const { context, page } = await newPage({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  for (const [name, hash, t] of [
    ['index', '#/', '12:00'],
    ['record-003', '#/record/003', '01:55'],
    ['search', '#/search', '12:00'],
  ]) {
    await page.goto(`${BASE}?debug=true&t=${t}${hash}`);
    await page.waitForSelector('.site-title');
    await page.evaluate(() => document.querySelector('.debug-head button')?.click());
    await wait(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`F ${w}px ${name}: no horizontal overflow`, overflow <= 1, `overflow ${overflow}px`);
    await page.screenshot({ path: `${OUT}/F-${w}-${name}.png`, fullPage: name !== 'index' ? false : true });
  }
  // touch targets in nav
  await page.goto(`${BASE}#/`);
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('.nav a, .tool-toggle, .record-list a')].filter((el) => el.getBoundingClientRect().height < 36).length,
  );
  check(`F ${w}px touch targets ≥ 36px`, small === 0, `${small} small`);
  // clock visible without scrolling on mobile
  const clockTop = await page.evaluate(() => document.querySelector('.clock')?.getBoundingClientRect().top ?? 9999);
  check(`F ${w}px clock visible in first screen`, clockTop < h, `top ${Math.round(clockTop)}`);
  await context.close();
}

// ── Test F2 — the 02:00 event in a 9:16 phone viewport (reels) ─────────
{
  const { context, page, errors } = await newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await page.goto(`${BASE}?debug=true&t=01:59:57#/`);
  await page.waitForSelector('.debug-head button');
  await page.click('.debug-head button');
  await page.screenshot({ path: `${OUT}/F2-mobile-0159.png` });
  const shots = [
    [4000, 'freeze'],
    [5000, 'fade'],
    [5000, 'strip'],
    [5000, 'record'],
    [7000, 'recall'],
    [6000, 'photo'],
    [8000, 'after'],
  ];
  for (const [ms, name] of shots) {
    await wait(ms);
    await page.screenshot({ path: `${OUT}/F2-mobile-event-${name}.png` });
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('F2 phone: 02:00 sequence completes on Record 009', page.url().includes('#/record/009'));
  check('F2 phone: no horizontal overflow after the event', overflow <= 1, `overflow ${overflow}px`);
  check('F2 phone: no JS errors', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ── Test J — her: jump scares are earned, never on a normal first visit ─
{
  const { context, page, errors } = await newPage();
  const scareWithin = (ms) => page.waitForSelector('.scare', { timeout: ms }).then(() => true, () => false);
  const toEnd = () => page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await page.goto(`${BASE}?debug=true&t=12:00#/record/006`);
  await page.waitForSelector('.debug');
  await page.click('.debug-head button');
  await toEnd();
  check('J no jump scare in daylight (reading Tape 6 at 12:00)', !(await scareWithin(2500)));

  await page.goto(`${BASE}?debug=true&t=01:56#/record/006`);
  await page.waitForSelector('.record-title');
  await wait(400);
  await toEnd();
  const tape = await page.waitForSelector('.scare-lunge', { timeout: 5000 }).then(() => true, () => false);
  check('J reading Tape 6 to the end at 01:56 → jump scare', tape);
  await wait(200);
  await page.screenshot({ path: `${OUT}/J-tape-lunge.png` });
  await wait(1500);
  check('J the scare clears itself', (await page.locator('.scare').count()) === 0);

  await page.goto(`${BASE}#/record/003`);
  await page.click('.secret-sentence button');
  await page.goto(`${BASE}#/system`);
  await page.waitForSelector('.terminal-choices button', { timeout: 15000 });
  await page.click('.terminal-choices button >> text=[Y]');
  await page.waitForSelector('#cmd:not([disabled])', { timeout: 20000 });
  await page.fill('#cmd', 'varga');
  await page.press('#cmd', 'Enter');
  check('J saying her name in the terminal → jump scare', await page.waitForSelector('.scare-lunge', { timeout: 6000 }).then(() => true, () => false));

  await page.goto(`${BASE}#/`);
  await page.evaluate(() => [...document.querySelectorAll('.footer button')].find((b) => b.textContent === '효과 줄이기')?.click());
  if (await page.locator('.debug-fab').count()) await page.click('.debug-fab');
  await page.click('.debug button:text-is("Jump scare")');
  check('J reduced effects → soft version (no strobe/zoom)', await page.waitForSelector('.scare-reduced', { timeout: 2000 }).then(() => true, () => false));
  check('J no JS errors', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ── Test G — sound ──────────────────────────────────────────────────────
{
  const { context, page, errors } = await newPage();
  await page.goto(BASE);
  const btn = page.locator('.tool-toggle');
  check('G sound defaults to ON (waiting for a gesture)', (await btn.getAttribute('aria-pressed')) === 'true');
  const ctxBefore = await page.evaluate(() => typeof window.AudioContext);
  await page.click('.record-list a >> nth=0');
  await wait(500);
  await btn.click();
  check('G sound can be turned off', (await btn.getAttribute('aria-pressed')) === 'false');
  await btn.click();
  check('G sound can be turned back on', (await btn.getAttribute('aria-pressed')) === 'true');
  await page.reload();
  await btn.click();
  await page.reload();
  check('G sound preference persists', (await page.locator('.tool-toggle').getAttribute('aria-pressed')) === 'false');
  check('G no audio errors', errors.length === 0 && ctxBefore === 'function', errors.join(' | '));
  await context.close();
}

// ── Test H — debug & robustness ─────────────────────────────────────────
{
  const { context, page, errors } = await newPage();
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('night-archive:save', '{not json');
      sessionStorage.setItem('seeded', '1');
    }
  });
  await page.goto(`${BASE}?debug=true#/`);
  await page.waitForSelector('.debug');
  check('H malformed save does not break the site', (await page.textContent('.welcome'))?.trim() === '어서 오세요.');
  for (const l of ['0', '1', '2', '3', '4', '5']) {
    await page.click(`.debug button:text-is("L${l}")`);
    await wait(300);
    check(`H force level ${l}`, (await level(page)) === l);
  }
  await page.click('.debug button:text-is("L3")');
  let fired = 0;
  for (let i = 0; i < 6; i++) {
    await page.click('.debug button:text-is("Random anomaly")');
    await wait(250);
    const note = await page.textContent('.debug-note');
    if (note && !note.includes('none')) fired++;
    await wait(1600);
  }
  check('H random anomaly fires', fired >= 3, `${fired}/6`);
  await page.click('.debug button:text-is("Unlock all")');
  await wait(800);
  let save = await readSave(page);
  check('H unlock all', ['A', 'B', 'C', 'D'].every((k) => save.secretProgress[k].found));
  await page.click('.debug button:text-is("End: normal")');
  await page.waitForURL(/ending\/normal/);
  check('H test ending', await page.waitForSelector('.ending-title', { timeout: 5000 }).then(() => true, () => false));
  await page.goto(`${BASE}#/`);
  await page.click('.debug button:text-is("Reset save")');
  await wait(600);
  save = await readSave(page);
  check('H reset save', save.visitCount === 1 && !save.secretProgress.A.found);
  await page.click('.debug button:text-is("auto")');
  // localStorage disabled entirely
  const c2 = await browser.newContext();
  const p2 = await c2.newPage();
  const e2 = [];
  p2.on('pageerror', (e) => e2.push(String(e)));
  await p2.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('denied');
      },
    });
  });
  await p2.goto(BASE);
  await p2.waitForSelector('.record-list li');
  check('H works with storage disabled', e2.length === 0, e2.join(' | '));
  await c2.close();
  check('H no JS errors', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ── Anomaly render sweep: every anomaly fires without errors ────────────
{
  const { context, page, errors } = await newPage();
  await page.goto(`${BASE}?debug=true&t=12:00#/record/003`);
  await page.waitForSelector('.debug');
  await page.click('.debug button:text-is("L4")');
  const ids = await page.evaluate(() => [...document.querySelectorAll('.debug select option')].map((o) => o.value));
  for (const id of ids) {
    await page.selectOption('.debug select', id);
    await page.click('.debug button:text-is("Fire")');
    await wait(120);
  }
  await page.screenshot({ path: `${OUT}/anomaly-sweep.png` });
  check(`Anomaly sweep (${ids.length} anomalies) without errors`, errors.length === 0, errors.join(' | '));
  await context.close();
}

await browser.close();
console.log(`\n${results.length - failures}/${results.length} checks passed`);
process.exit(failures ? 1 : 0);
