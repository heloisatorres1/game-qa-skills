// Smoke gate: boot, first launch on a clean profile (video), core loop in and out, every main-menu button opens something.
import * as L from './lib.mjs';

const D = L.dirs('smoke');
const results = [];
const log = [];
const check = (id, name, pass, expected, actual, evidence = []) => { const r = { id, name, pass, expected, actual, evidence }; results.push(r); L.saveResults(D.file('results.json'), [r]); console.log(pass ? 'PASS' : 'FAIL', id, name, '|', JSON.stringify(actual).slice(0, 220)); };
const browser = await L.launch();

// SM-01..03: clean profile, boot time, first launch flow, recorded
if (L.only('SM-01', 'SM-02', 'SM-03')) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'SM-01');
  const failed = []; page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  await page.goto(L.BASE + 'package.json'); await page.evaluate(() => localStorage.clear());
  const rec = await L.record(page);
  const t0 = Date.now();
  await page.goto(L.BASE);
  await page.locator('#popup-age').waitFor({ state: 'visible', timeout: 20000 });
  const bootMs = Date.now() - t0;
  await L.shot(page, D.file('SM-01-age-gate.jpg'));
  check('SM-01', 'Clean install boots to the first interactive screen (age gate)', bootMs < 6000, '< 6 s', { boot_ms: bootMs }, ['SM-01-age-gate.jpg']);
  await page.locator('[data-age="18+"]').click(); await page.locator('#age-confirm').click();
  await page.locator('#cutscene').waitFor({ state: 'visible', timeout: 10000 }); await L.sleep(page, 1500);
  await L.shot(page, D.file('SM-02-1-story.jpg'));
  await page.locator('[data-action="story-skip"]').click();
  await page.locator('#popup-welcome').waitFor({ state: 'visible', timeout: 10000 }); await L.sleep(page, 500);
  await L.shot(page, D.file('SM-02-2-welcome.jpg'));
  await page.locator('[data-action="welcome-play"]').click(); await L.sleep(page, 2500);
  const screen = await L.activeScreen(page);
  const tutorial = await page.locator('#tutorial').isVisible();
  await L.shot(page, D.file('SM-02-3-first-level.jpg'));
  await rec.stop(D.file('SM-02-first-launch.webm'));
  check('SM-02', 'First launch: age gate -> story -> welcome -> first level with the tutorial', screen === 'screen-game' && tutorial, 'game screen + tutorial',
    { screen, tutorial }, ['SM-02-1-story.jpg', 'SM-02-2-welcome.jpg', 'SM-02-3-first-level.jpg', 'SM-02-first-launch.webm']);
  const errors = log.filter((l) => /pageerror/.test(l));
  L.writeJson(D.file('SM-03-boot-log.json'), { console: log, http_errors: failed });
  check('SM-03', 'No script errors during boot and first launch', !errors.length, '0 page errors', { page_errors: errors.length, http_errors: failed }, ['SM-03-boot-log.json']);
  await ctx.close();
}

// SM-04: core loop in and out (returning player)
if (L.only('SM-04')) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'SM-04');
  await L.seed(page, L.PLAYER()); await L.openGame(page);
  await page.locator('[data-action="play"]:visible').first().click({ force: true }); // the Play button pulses, so it is never 'stable' await L.sleep(page, 1500);
  const inGame = await L.activeScreen(page);
  await page.locator('[data-action="pause"]:visible').first().click(); await L.sleep(page, 400);
  await L.shot(page, D.file('SM-04-1-pause.jpg'));
  await page.locator('#popup-pause [data-action="quit"]').click(); await L.sleep(page, 800);
  const back = await L.activeScreen(page);
  await L.shot(page, D.file('SM-04-2-back.jpg'));
  check('SM-04', 'Play opens a level; Pause > Exit to Menu leaves it', inGame === 'screen-game' && back === 'screen-theme', 'screen-game, then screen-theme', { in_game: inGame, after_exit: back }, ['SM-04-1-pause.jpg', 'SM-04-2-back.jpg']);
  await ctx.close();
}

// SM-05: every main-menu button opens a screen or a popup
if (L.only('SM-05')) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'SM-05');
  await L.seed(page, L.PLAYER()); await L.openGame(page);
  const buttons = await page.evaluate(() => [...document.querySelectorAll('#screen-menu [data-action], .bottom-nav [data-action], .nav-btn[data-action]')]
    .filter((b) => b.offsetParent !== null).map((b) => b.dataset.action).filter((a, i, all) => all.indexOf(a) === i));
  const out = {};
  for (const a of buttons) {
    if (['play', 'debug'].includes(a)) continue;
    await L.openGame(page, '', 2800);
    const before = { screen: await L.activeScreen(page), popups: await L.visiblePopups(page) };
    await page.locator(`[data-action="${a}"]:visible`).first().click().catch(() => {});
    await L.sleep(page, 700);
    const after = { screen: await L.activeScreen(page), popups: await L.visiblePopups(page) };
    out[a] = { opened: after.screen !== before.screen || after.popups.length > before.popups.length, screen: after.screen, popups: after.popups };
    await L.shot(page, D.file(`SM-05-${a}.jpg`));
  }
  L.writeJson(D.file('SM-05-buttons.json'), out);
  const dead = Object.entries(out).filter(([a, r]) => !r.opened && a !== 'home').map(([a]) => a);
  check('SM-05', 'Every main-menu button opens a screen or popup', !dead.length, 'no dead buttons', { tested: Object.keys(out), dead }, ['SM-05-buttons.json']);
  await ctx.close();
}

await browser.close();
L.writeJson(D.file('console.json'), log);
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} passed`);
