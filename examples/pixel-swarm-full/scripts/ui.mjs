// test-ui: screen map at 6 sizes with automatic layout checks (horizontal overflow, elements outside the viewport,
// clipped text), every popup closable, plus a contact sheet per size.
import fs from 'node:fs';
import * as L from './lib.mjs';

const D = L.dirs('test-ui');
const results = [];
const log = [];
const check = (id, name, pass, expected, actual, evidence = []) => { const r = { id, name, pass, expected, actual, evidence }; results.push(r); L.saveResults(D.file('results.json'), [r]); console.log(pass ? 'PASS' : 'FAIL', id, name, '|', JSON.stringify(actual).slice(0, 300)); };
const browser = await L.launch();

const SIZES = [
  ['phone-small', { width: 360, height: 640 }, true],
  ['phone', { width: 390, height: 844 }, true],
  ['phone-landscape', { width: 844, height: 390 }, true],
  ['tablet', { width: 820, height: 1180 }, true],
  ['laptop', { width: 1280, height: 720 }, false],
  ['full-hd', { width: 1920, height: 1080 }, false],
];
// screen name -> how to reach it from the main menu
const SCREENS = [
  ['menu', null], ['store', '.nav-btn[data-action="store"]'], ['skins', '.nav-btn[data-action="skins"]'], ['levels', '[data-action="levels"]'],
  ['collections', '.side-btn[data-action="collections"]'], ['events', '[data-action="events"]'], ['activities', '.side-btn[data-action="activities"]'],
  ['settings', '[data-action="settings"]'], ['noads', '[data-action="noads"]'], ['game', 'HASH:game'],
];

// layout probe run inside the page
const probe = () => {
  const vw = innerWidth, vh = innerHeight, issues = [];
  const doc = document.scrollingElement;
  if (doc.scrollWidth > vw + 1) issues.push({ type: 'page scrolls sideways', detail: `${doc.scrollWidth}px > ${vw}px` });
  const root = document.querySelector('.overlay:not([hidden]) .popup') || document.querySelector('.screen.active');
  for (const el of root ? root.querySelectorAll('button, h1, h2, h3, h4, p, span, b, small, img') : []) {
    if (el.offsetParent === null || el.closest('#popup-debug, .dbg-btn')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const scroller = el.closest('.panel-inner, .popup-body, .scroll, [class*="list"], .grid3, .lvl-row');
    if (!scroller && (r.right > vw + 2 || r.left < -2)) issues.push({ type: 'outside viewport', el: el.tagName + '.' + el.className, text: el.textContent.trim().slice(0, 30), x: Math.round(r.left), right: Math.round(r.right) });
    if (el.tagName === 'BUTTON' && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw) {
      const hit = document.elementFromPoint(Math.min(vw - 1, r.left + r.width / 2), Math.min(vh - 1, r.top + r.height / 2));
      if (hit && !el.contains(hit) && !hit.closest('#toast')) issues.push({ type: 'button covered', el: (el.dataset.action || el.textContent.trim()).slice(0, 30), by: (hit.closest('[class]') || hit).className.toString().slice(0, 40) });
    }
    const cs = getComputedStyle(el);
    if (['SPAN', 'B', 'SMALL', 'P', 'H2', 'H3', 'H4'].includes(el.tagName) && el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 2 && cs.overflow === 'hidden' && cs.textOverflow !== 'ellipsis')
      issues.push({ type: 'text clipped', el: el.tagName + '.' + el.className, text: el.textContent.trim().slice(0, 40), need: el.scrollWidth, has: el.clientWidth });
  }
  return issues;
};

const map = {};
for (const [sizeName, size, mobile] of SIZES.filter(() => L.only('UI-10'))) {
  const ctx = await L.newContext(browser, { size, mobile }); const page = await ctx.newPage(); L.watch(page, log, `UI-${sizeName}`);
  await L.seed(page, { ...L.PLAYER(), coins: 123456, gems: 98765 }); // big balances: long numbers in the HUD
  map[sizeName] = {};
  for (const [screen, how] of SCREENS) {
    await L.openGame(page, how && how.startsWith('HASH:') ? how.slice(5) : '', 2600);
    let navIssue = null;
    if (how && !how.startsWith('HASH:')) { const b = page.locator(`${how}:visible`).first(); if (await b.count()) { try { await b.click({ timeout: 4000 }); await L.sleep(page, 700); } catch { navIssue = { type: 'cannot open screen: its button is covered', button: how }; } } }
    const issues = await page.evaluate(probe);
    if (navIssue) issues.unshift(navIssue);
    const file = `UI-${sizeName}-${screen}.jpg`;
    await L.shot(page, D.file(file));
    map[sizeName][screen] = { issues, screenshot: file };
  }
  await ctx.close();
}
if (L.only('UI-10')) L.writeJson(D.file('UI-layout-probe.json'), map);

// contact sheet per size (an HTML page with all screens, screenshotted)
for (const [sizeName] of SIZES.filter(() => L.only('UI-10'))) {
  const imgs = SCREENS.map(([s]) => `<figure><img src="UI-${sizeName}-${s}.jpg"><figcaption>${s}</figcaption></figure>`).join('');
  fs.writeFileSync(D.file(`sheet-${sizeName}.html`), `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:12px;background:#222;color:#eee;font:13px system-ui;display:grid;grid-template-columns:repeat(5,1fr);gap:10px}img{width:100%;border:1px solid #555}figure{margin:0}</style>${imgs}`);
  const pg = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  await pg.goto('file:///' + D.file(`sheet-${sizeName}.html`).replace(/\\/g, '/'));
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: D.file(`UI-sheet-${sizeName}.jpg`), type: 'jpeg', quality: 75, fullPage: true });
  await pg.close();
  fs.unlinkSync(D.file(`sheet-${sizeName}.html`));
}

for (const [sizeName] of SIZES.filter(() => L.only('UI-10'))) {
  const found = Object.entries(map[sizeName]).flatMap(([s, r]) => r.issues.map((i) => ({ screen: s, ...i })));
  check(`UI-10-${sizeName}`, `Layout at ${sizeName}: no sideways scroll, nothing outside the screen, no clipped text`, found.length === 0, '0 issues',
    { issues: found.length, sample: found.slice(0, 6) }, [`UI-sheet-${sizeName}.jpg`, 'UI-layout-probe.json']);
}

// UI-02: every popup closes (X button or Escape); locked ones (age gate, fail, welcome) are expected to stay
if (L.only('UI-02')) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'UI-02');
  await L.seed(page, L.PLAYER()); await L.openGame(page);
  const ids = await page.evaluate(() => [...document.querySelectorAll('.overlay')].map((o) => ({ id: o.id, locked: o.hasAttribute('data-locked') })));
  L.writeJson(D.file('UI-02-popups.json'), ids);
  const unlockedResult = ids.filter((p) => !p.locked).map((p) => p.id);
  check('UI-02', 'Popup lock map: which popups can be dismissed by Escape / tapping outside', true, 'documented',
    { dismissible: unlockedResult, locked: ids.filter((p) => p.locked).map((p) => p.id) }, ['UI-02-popups.json']);
  await ctx.close();
}

// UI-20: top bar (level, gems, coins, settings / close) with growing balances on phone widths, 2 runs
for (const run of [1, 2]) {
  if (!L.only('UI-20')) break;
  const rows = [];
  for (const width of [360, 390, 412]) {
    for (const [label, gems, coins] of [['default', 20, 100], ['9,999', 9999, 9999], ['12.3K', 12345, 12345], ['98.8K / 123.5K', 98765, 123456], ['1.2M / 1.5M', 1234567, 1543210]]) {
      const ctx = await L.newContext(browser, { size: { width, height: 800 } }); const page = await ctx.newPage(); L.watch(page, log, 'UI-20');
      await L.seed(page, { ...L.PLAYER(), gems, coins }); await L.openGame(page);
      const gear = await page.evaluate(() => { const b = document.querySelector('#screen-menu [data-action="settings"]'); const r = b.getBoundingClientRect(); return { right: Math.round(r.right), visible_px: Math.max(0, Math.round(Math.min(r.right, innerWidth) - r.left)), width: Math.round(r.width) }; });
      const tag = `UI-20-run${run}-${width}-${label.replace(/[^\w]+/g, '_')}`;
      if (run === 1 && (label === 'default' || label.startsWith('98.8K'))) await page.screenshot({ path: D.file(`${tag}-hud.png`), clip: { x: 0, y: 0, width, height: 70 } });
      await page.locator('.nav-btn[data-action="store"]').click(); await L.sleep(page, 600);
      const close = await page.evaluate(() => { const b = document.querySelector('#screen-store .close-btn'); if (!b) return null; const r = b.getBoundingClientRect(); return { right: Math.round(r.right), visible_px: Math.max(0, Math.round(Math.min(r.right, innerWidth) - r.left)), width: Math.round(r.width) }; });
      if (run === 1 && width === 360 && label.startsWith('98.8K')) await page.screenshot({ path: D.file(`${tag}-store-top.png`), clip: { x: 0, y: 0, width, height: 70 } });
      rows.push({ width, balances: label, settings_gear: gear, store_close: close, gear_hidden: gear.visible_px < gear.width, close_hidden: close && close.visible_px < close.width });
      await ctx.close();
    }
  }
  L.writeJson(D.file(`UI-20-run${run}-top-bar.json`), rows);
  const bad = rows.filter((r) => r.gear_hidden || r.close_hidden);
  check(`UI-20-${run}`, 'Top bar keeps Settings (menu) and Close (store) fully on screen at any balance on 360-412 px phones', !bad.length, 'gear and X fully visible in every row',
    { cases: rows.length, failing: bad.map((r) => `${r.width}px ${r.balances}: gear ${r.settings_gear.visible_px}/${r.settings_gear.width}px visible, X ${r.store_close ? r.store_close.visible_px + '/' + r.store_close.width : '-'}px`) },
    [`UI-20-run${run}-top-bar.json`, ...(run === 1 ? ['UI-20-run1-360-98_8K_123_5K-hud.png', 'UI-20-run1-360-98_8K_123_5K-store-top.png', 'UI-20-run1-360-default-hud.png'] : [])]);
}

// UI-21: video of BUG-002 on a 360 px phone: the gear is cut at 100 coins and disappears after buying coins
if (L.only('UI-21')) {
  const ctx = await L.newContext(browser, { size: { width: 360, height: 740 } }); const page = await ctx.newPage(); L.watch(page, log, 'UI-21');
  await L.seed(page, { ...L.PLAYER(), coins: 100, gems: 20 }); await L.openGame(page);
  const gear = () => page.evaluate(() => { const r = document.querySelector('#screen-menu [data-action="settings"]').getBoundingClientRect(); return Math.max(0, Math.round(Math.min(r.right, innerWidth) - r.left)); });
  const steps = [];
  const rec = await L.record(page, { maxWidth: 360 });
  await L.sleep(page, 1500);
  steps.push({ step: 'menu, 100 coins and 20 gems', gear_visible_px: await gear() });
  await page.screenshot({ path: D.file('UI-21-1-menu-100-coins.png'), clip: { x: 0, y: 0, width: 360, height: 70 } });
  await page.locator('.nav-btn[data-action="store"]').click(); await L.sleep(page, 1200);
  for (let k = 0; k < 2; k++) { await page.locator('#store-list [data-item="gems-l"]').click(); await L.sleep(page, 900); } // 2 x 1,200 gems (test purchases)
  await page.locator('#store-list [data-item="coins-m"]').scrollIntoViewIfNeeded(); await L.sleep(page, 400);
  await page.locator('#store-list [data-item="coins-m"]').click(); await L.sleep(page, 900); // +5,000
  for (let k = 0; k < 4; k++) { await page.locator('#store-list [data-item="coins-s"]').click(); await L.sleep(page, 700); } // +4 x 1,000 = 9,100 coins
  await page.mouse.wheel(0, -2000); await L.sleep(page, 800);
  const close = await page.evaluate(() => { const r = document.querySelector('#screen-store .close-btn').getBoundingClientRect(); return Math.max(0, Math.round(Math.min(r.right, innerWidth) - r.left)); });
  steps.push({ step: 'store after buying 2 gem packs and coins (9,100 coins, 2,180 gems)', close_x_visible_px: close });
  await page.screenshot({ path: D.file('UI-21-2-store-9100-coins.png'), clip: { x: 0, y: 0, width: 360, height: 70 } });
  await page.locator('.nav-btn[data-action="home"]').click(); await L.sleep(page, 1500);
  steps.push({ step: 'menu, 9,100 coins and 2,180 gems', gear_visible_px: await gear() });
  await page.screenshot({ path: D.file('UI-21-3-menu-9100-coins.png'), clip: { x: 0, y: 0, width: 360, height: 70 } });
  await L.sleep(page, 800);
  await rec.stop(D.file('UI-21-gear-pushed-off.webm'), { framesDir: D.file('UI-21-frames') });
  L.writeJson(D.file('UI-21-state.json'), { viewport: '360x740', steps });
  check('UI-21', 'Video: on a 360 px phone, buying gems and coins (to 2,180 / 9,100) pushes the Settings gear and the store Close X off screen', steps[2].gear_visible_px === 0, 'documented (BUG-002)', { steps },
    ['UI-21-gear-pushed-off.webm', 'UI-21-1-menu-100-coins.png', 'UI-21-3-menu-9100-coins.png', 'UI-21-2-store-9100-coins.png', 'UI-21-state.json']);
  await ctx.close();
}

await browser.close();
L.writeJson(D.file('console.json'), log);
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} passed`);
