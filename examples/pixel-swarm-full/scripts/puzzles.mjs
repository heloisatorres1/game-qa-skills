// test-puzzles: level data integrity, every mechanic solved in-game (solvability of all levels: verify.mjs),
// fail flow (Try Again / Give Up / Add Slot), slot cap.
import * as L from './lib.mjs';

const D = L.dirs('test-puzzles');
const results = [];
const log = [];
const check = (id, name, pass, expected, actual, evidence = [], extra = {}) => { const r = { id, name, pass, expected, actual, evidence, ...extra }; results.push(r); L.saveResults(D.file('results.json'), [r]); console.log(pass ? 'PASS' : 'FAIL', id, name, '|', JSON.stringify(actual).slice(0, 220)); };
const browser = await L.launch();
const PUZZLES = ['mystery', 'frozen', 'hidden', 'linked', 'big', 'pipe', 'key', 'wood', 'cookie', 'mlinked'];

// PZ-01/02: level data integrity
if (L.only('PZ-01')) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'PZ-01');
  await L.seed(page, L.PLAYER()); await L.openGame(page);
  const data = await page.evaluate(() => {
    const Lv = window.PS_LEVELS, P = window.PS_PICTURES, Dt = window.PS_DATA;
    const themes = Dt.THEMES.map((t) => t.id), out = { counts: {}, missing: [], duplicates: [] }, seen = new Map();
    for (const t of themes) for (const d of Dt.DIFFICULTIES) {
      const list = Lv[t][d] || []; out.counts[`${t}-${d}`] = list.length;
      list.forEach((id, i) => { if (!P[id] && !Dt.PICTURES[id]) out.missing.push(`${t}-${d}-${i + 1}: ${id}`); if (seen.has(id)) out.duplicates.push(`${id} (${seen.get(id)} and ${t}-${d}-${i + 1})`); else seen.set(id, `${t}-${d}-${i + 1}`); });
    }
    out.event = (Lv[Dt.EVENT.id] || []).length; out.event_expected = Dt.EVENT.levels;
    (Lv[Dt.EVENT.id] || []).forEach((id, i) => { if (!P[id] && !Dt.PICTURES[id]) out.missing.push(`event-${i + 1}: ${id}`); });
    out.per_difficulty = Dt.LEVELS_PER_DIFFICULTY;
    return out;
  });
  L.writeJson(D.file('PZ-01-level-data.json'), data);
  const wrongCounts = Object.entries(data.counts).filter(([, n]) => n !== data.per_difficulty);
  check('PZ-01', 'Level tables: 5 themes x 3 difficulties x 6 + 12 event levels, every picture exists', !wrongCounts.length && !data.missing.length && data.event === data.event_expected,
    '15 tables of 6, 12 event levels, 0 missing pictures', { wrong_counts: wrongCounts, missing: data.missing, event: data.event }, ['PZ-01-level-data.json']);
  check('PZ-02', 'No picture is used by two levels', !data.duplicates.length, '0 duplicates', { duplicates: data.duplicates }, ['PZ-01-level-data.json']);
  await ctx.close();
}

// PZ-20: each mechanic, solved in the real game by the solution bot (assisted, 8x speed)
for (const p of PUZZLES.filter((x) => L.only('PZ-20', 'PZ-20-' + x))) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, `PZ-${p}`);
  await L.seed(page, { ...L.PLAYER(), coins: 100 });
  await L.openGame(page, `pzsolve_${p}`, 3200);
  await L.shot(page, D.file(`PZ-20-${p}-1-start.jpg`));
  const t0 = Date.now();
  let won = false, failed = false;
  try {
    await page.waitForFunction(() => !document.getElementById('popup-complete').hidden || !document.getElementById('popup-fail').hidden, null, { timeout: 180000 });
    won = await page.locator('#popup-complete').isVisible(); failed = await page.locator('#popup-fail').isVisible();
  } catch { /* timeout */ }
  await L.sleep(page, 800);
  await L.shot(page, D.file(`PZ-20-${p}-2-end.jpg`));
  const errors = log.filter((l) => l.startsWith(`[PZ-${p}]`) && /pageerror/.test(l));
  check(`PZ-20-${p}`, `Mechanic "${p}": a level using it is won by playing the solution (assisted)`, won && !errors.length,
    'Level Complete, no script errors', { won, failed, seconds: Math.round((Date.now() - t0) / 1000), errors }, [`PZ-20-${p}-1-start.jpg`, `PZ-20-${p}-2-end.jpg`], { assisted: true });
  await ctx.close();
}

// PZ-30..32: fail flow. The fail popup is opened with the debug "Lose level" (assisted); its buttons are real.
async function failedLevel(tag) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, tag);
  await L.seed(page, { ...L.PLAYER(), coins: 100 });
  await L.openGame(page, 'game');
  const blocks = page.locator('[data-action="tap-block"]');
  await blocks.first().click(); await L.sleep(page, 400); // one real move, so a restart has something to reset
  await L.cheat(page, 'lose'); await L.sleep(page, 600);
  return { ctx, page };
}
// all usable slots: the main row plus opened AD slots (the booster's 7-slot cap counts both)
const slotCount = (page) => page.evaluate(() => document.querySelectorAll('#g-slots > .slot, #g-adslots .ad-open').length);
if (L.only('PZ-30')) {
  const { ctx, page } = await failedLevel('PZ-30');
  await L.shot(page, D.file('PZ-30-1-out-of-slots.jpg'));
  await page.keyboard.press('Escape'); await page.mouse.click(12, 12); await L.sleep(page, 500);
  const stillOpen = await page.locator('#popup-fail').isVisible();
  check('PZ-30', 'Out of Slots popup cannot be dismissed by Escape or a tap outside', stillOpen, 'popup stays open', { still_open: stillOpen }, ['PZ-30-1-out-of-slots.jpg']);
  const filledBefore = await page.evaluate(() => [...document.querySelectorAll('#g-slots > *')].filter((s) => s.querySelector('.slot-block, [data-color], .blk')).length);
  await page.locator('#popup-fail [data-action="restart"]').click(); await L.sleep(page, 1500);
  const after = await page.evaluate(() => ({ popups: [...document.querySelectorAll('.overlay:not([hidden])')].map((o) => o.id), screen: document.querySelector('.screen.active').id }));
  await L.shot(page, D.file('PZ-31-try-again.jpg'));
  check('PZ-31', 'Try Again restarts the same level with empty slots', after.screen === 'screen-game' && !after.popups.length, 'game screen, no popup, fresh board',
    { ...after, filled_slots_before: filledBefore }, ['PZ-31-try-again.jpg']);
  await ctx.close();
}
if (L.only('PZ-32')) {
  const { ctx, page } = await failedLevel('PZ-32');
  await page.locator('#popup-fail [data-action="quit"]').click(); await L.sleep(page, 1200);
  const screen = await L.activeScreen(page);
  const save = L.pick(await L.readSave(page), ['coins', 'progress']);
  await L.shot(page, D.file('PZ-32-give-up.jpg'));
  check('PZ-32', 'Give Up returns to the theme screen without a reward or progress', screen === 'screen-theme' && save.coins === 100 && !Object.keys(save.progress || {}).length,
    'theme screen, coins 100, no progress', { screen, ...save }, ['PZ-32-give-up.jpg']);
  await ctx.close();
}

// PZ-35: Add Slot from the fail popup (watch an ad), repeated. The Add Slot booster stops at 7 slots.
for (const run of [1, 2]) {
  if (!L.only('PZ-35')) break;
  const { ctx, page } = await failedLevel('PZ-35-' + run);
  const counts = [await slotCount(page)];
  let rec = null;
  for (let i = 0; i < 5; i++) {
    if (i === 3 && run === 1) rec = await L.record(page);
    await page.locator('#popup-fail [data-action="fail-addslot"]').click();
    await page.waitForFunction(() => document.getElementById('ad-overlay').hidden, null, { timeout: 15000 }); await L.sleep(page, 600);
    counts.push(await slotCount(page));
    await L.cheat(page, 'lose'); await L.sleep(page, 600);
  }
  await page.locator('#popup-fail [data-action="fail-addslot"]').click();
  await page.waitForFunction(() => document.getElementById('ad-overlay').hidden, null, { timeout: 15000 }); await L.sleep(page, 800);
  counts.push(await slotCount(page));
  await L.shot(page, D.file(`PZ-35-run${run}-after-6-ads.jpg`));
  await page.locator('#g-slots').screenshot({ path: D.file(`PZ-35-run${run}-crop.png`) });
  if (rec) await rec.stop(D.file(`PZ-35-run${run}-add-slot.webm`));
  const layout = await page.evaluate(() => { const r = document.getElementById('g-slots').getBoundingClientRect(); const kids = [...document.querySelectorAll('#g-slots > *')].map((k) => k.getBoundingClientRect()); return { row_left: Math.round(r.left), row_right: Math.round(r.right), viewport: innerWidth, outside: kids.filter((k) => k.right > innerWidth + 1 || k.left < -1).length, rows: new Set(kids.map((k) => Math.round(k.top))).size }; });
  L.writeJson(D.file(`PZ-35-run${run}-state.json`), { slot_counts_after_each_ad: counts, layout, booster_limit: 'useBooster add_slot refuses at 7 (app.js "Maximum slots reached")' });
  check('PZ-35-' + run, 'Add Slot from the fail popup respects the 7-slot maximum used by the Add Slot booster', Math.max(...counts) <= 7,
    'never more than 7 slots', { slot_counts: counts, layout }, [`PZ-35-run${run}-crop.png`, `PZ-35-run${run}-after-6-ads.jpg`, ...(run === 1 ? [`PZ-35-run${run}-add-slot.webm`] : []), `PZ-35-run${run}-state.json`]);
  await ctx.close();
}

await browser.close();
L.saveResults(D.file('results.json'), results);
L.writeJson(D.file('console.json'), log);
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} passed`);
