// Catalog checklists (features without a dedicated skill): tutorial, ads, lifecycle, accessibility, input.
import * as L from './lib.mjs';

const D = L.dirs('catalog');
const results = [];
const log = [];
const check = (id, name, pass, expected, actual, evidence = []) => { const r = { id, name, pass, expected, actual, evidence }; results.push(r); L.saveResults(D.file('results.json'), [r]); console.log(pass ? 'PASS' : 'FAIL', id, name, '|', JSON.stringify(actual).slice(0, 240)); };
const browser = await L.launch();

// CT-TUT-1..2: tutorial walks through all 6 steps and is not shown again
if (L.only('CT-TUT-1')) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'CT-TUT');
  await L.seed(page, { ...L.PLAYER(), tutorialSeen: false });
  await L.openGame(page, 'game', 3200);
  const steps = [];
  for (let i = 0; i < 12 && steps.length < 6; i++) {
    if (!(await page.locator('#tutorial').isVisible())) { await L.sleep(page, 700); continue; }
    const text = (await page.locator('#tut-text').innerText()).trim();
    if (steps[steps.length - 1] !== text) { steps.push(text); await L.shot(page, D.file(`CT-TUT-1-step${steps.length}.jpg`)); }
    if (await page.locator('#tut-hand').isVisible()) {
      const box = await page.locator('#tut-spot').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    } else await page.locator('#tutorial').click();
    await L.sleep(page, 900);
  }
  await L.sleep(page, 2500);
  const seen = (await L.readSave(page)).tutorialSeen;
  check('CT-TUT-1', 'Tutorial: all 6 steps can be completed (including the "tap this block" step)', steps.length === 6 && seen === true, '6 steps, tutorialSeen saved',
    { steps: steps.length, tutorialSeen: seen, texts: steps.map((s) => s.slice(0, 40)) }, Array.from({ length: steps.length }, (_, i) => `CT-TUT-1-step${i + 1}.jpg`));
  await page.reload(); await L.openGame(page, 'game', 3200);
  const again = await page.locator('#tutorial').isVisible();
  check('CT-TUT-2', 'Tutorial is not shown again after it was completed', !again, 'no tutorial on the next level start', { tutorial_visible: again }, []);
  await ctx.close();
}

// CT-ADS-1: interstitial video ad after every 2nd win (no No Ads); none with No Ads
for (const [id, noAds] of [['CT-ADS-1', false], ['CT-ADS-2', true]].filter(([i]) => L.only(i))) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, id);
  await L.seed(page, { ...L.PLAYER(), noAds, winsSinceAd: 1 });
  await L.openGame(page, 'game');
  await L.cheat(page, 'win'); await L.sleep(page, 1500); // debug win: opens the real Level Complete popup
  await page.locator('#popup-complete [data-action="win-continue"]').click(); await L.sleep(page, 600);
  const adShown = await page.locator('#ad-overlay').isVisible();
  await L.shot(page, D.file(`${id}-after-continue.jpg`));
  await L.sleep(page, 3800);
  const after = { screen: await L.activeScreen(page), ad_visible: await page.locator('#ad-overlay').isVisible() };
  const want = !noAds;
  check(id, noAds ? 'With No Ads, no interstitial after the 2nd win' : 'Without No Ads, a video ad plays after the 2nd win, then the next level opens', adShown === want && !after.ad_visible && after.screen === 'screen-game',
    `ad shown = ${want}, then next level`, { ad_shown: adShown, ...after }, [`${id}-after-continue.jpg`]);
  await ctx.close();
}

// CT-ADS-3: rewarded AD slot opens one extra slot once, after the ad finishes
if (L.only('CT-ADS-3')) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'CT-ADS-3');
  await L.seed(page, L.PLAYER()); await L.openGame(page, 'game');
  const count = () => page.evaluate(() => document.querySelectorAll('#g-slots > .slot, #g-adslots .ad-open').length);
  const before = await count();
  await page.locator('#g-adslots [data-action="ad-slot"]').first().click(); await L.sleep(page, 1000);
  const during = await count();
  await page.waitForFunction(() => document.getElementById('ad-overlay').hidden, null, { timeout: 10000 }); await L.sleep(page, 500);
  const after = await count();
  await page.locator('#g-adslots').screenshot({ path: D.file('CT-ADS-3-ad-slot-open.png') }).catch(() => {});
  await L.shot(page, D.file('CT-ADS-3-after.jpg'));
  check('CT-ADS-3', 'Rewarded AD slot: +1 slot only after the ad ends', during === before && after === before + 1, `${before} -> ${before + 1} after the ad`, { before, during_ad: during, after }, ['CT-ADS-3-after.jpg']);
  await ctx.close();
}

// CT-LIFE-1: leaving the tab mid-level saves progress (visibilitychange/pagehide)
if (L.only('CT-LIFE-1')) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'CT-LIFE-1');
  await L.seed(page, { ...L.PLAYER(), coins: 100 }); await L.openGame(page);
  await page.locator('.nav-btn[data-action="store"]').click(); await L.sleep(page, 500);
  await page.locator('#store-list [data-item="gems-s"]').click(); await L.sleep(page, 300);
  // close the tab abruptly (no reload): a new tab must see the purchase
  await page.close({ runBeforeUnload: false });
  const p2 = await ctx.newPage(); await L.openGame(p2);
  const s = L.pick(await L.readSave(p2), ['gems']);
  await L.shot(p2, D.file('CT-LIFE-1-new-tab.jpg'));
  L.writeJson(D.file('CT-LIFE-1-state.json'), { steps: ['seed 20 gems', 'buy gems pack S (+100)', 'close the tab 300 ms later', 'open the game in a new tab'], gems_in_new_tab: s.gems });
  check('CT-LIFE-1', 'Closing the tab right after a purchase keeps it (saved immediately)', s.gems === 120, 'gems 120 in a new tab', s, ['CT-LIFE-1-state.json', 'CT-LIFE-1-new-tab.jpg']);
  await ctx.close();
}

// CT-A11Y-1: touch targets on the main screens (>= 44x44 CSS px is the common mobile guideline)
for (const run of [1, 2]) {
  if (!L.only('CT-A11Y-1')) break;
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'CT-A11Y');
  await L.seed(page, L.PLAYER());
  const small = {};
  for (const [name, hash, open] of [['menu', '', null], ['store', '', 'store'], ['settings', '', 'settings'], ['game', 'game', null]]) {
    await L.openGame(page, hash);
    if (open) { await page.locator(`[data-action="${open}"]:visible`).first().click(); await L.sleep(page, 600); }
    small[name] = await page.evaluate(() => [...(document.querySelector('.overlay:not([hidden])') || document.querySelector('.screen.active')).querySelectorAll('button, [data-action]')].filter((b) => b.offsetParent !== null && !b.closest('#popup-debug, #dbg-btn, .dbg-btn') && b.id !== 'dbg-btn')
      .map((b) => { const r = b.getBoundingClientRect(); return { el: (b.dataset.action || b.id || b.textContent.trim()).slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }; })
      .filter((x) => x.w > 0 && (x.w < 44 || x.h < 44)));
    await L.shot(page, D.file(`CT-A11Y-1-run${run}-${name}.jpg`));
  }
  L.writeJson(D.file(`CT-A11Y-1-run${run}-small-targets.json`), small);
  const n = Object.values(small).reduce((a, b) => a + b.length, 0);
  check('CT-A11Y-1-' + run, 'Touch targets on menu, store, settings and level are at least 44x44 px', n === 0, '0 smaller targets', { smaller_targets: Object.fromEntries(Object.entries(small).map(([k, v]) => [k, v.map((x) => `${x.el} ${x.w}x${x.h}`)])) }, [`CT-A11Y-1-run${run}-small-targets.json`]);
  await ctx.close();
}

await browser.close();
L.writeJson(D.file('console.json'), log);
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} passed`);
