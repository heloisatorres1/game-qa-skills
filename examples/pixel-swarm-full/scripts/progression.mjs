// test-progression: win flow, rewards, persistence, unlock boundaries, daily rewards, tasks, corrupted saves.
import * as L from './lib.mjs';

const D = L.dirs('test-progression');
const results = [];
const log = [];
const check = (id, name, pass, expected, actual, evidence = [], extra = {}) => { const r = { id, name, pass, expected, actual, evidence, ...extra }; results.push(r); L.saveResults(D.file('results.json'), [r]); console.log(pass ? 'PASS' : 'FAIL', id, name, '|', JSON.stringify(actual)); };
const browser = await L.launch();
const KEYS = ['coins', 'gems', 'progress', 'stats.levels', 'daily', 'boosters'];

// Plays Flowers Easy 1 with the auto-solve bot at 5x until the Level Complete popup shows.
async function winFirstLevel(page, seedData) {
  await L.seed(page, seedData);
  await L.openGame(page, 'game');
  await L.cheat(page, 'speed');
  await L.cheat(page, 'solve');
  await page.locator('#popup-complete').waitFor({ state: 'visible', timeout: 240000 });
  await L.sleep(page, 1500);
}

// ---- PR-W1: normal win: Continue pays the reward and starts the next level ----
if (L.only('PR-W1')) {
  const ctx = await L.newContext(browser);
  const page = await ctx.newPage(); L.watch(page, log, 'PR-W1');
  await winFirstLevel(page, { ...L.PLAYER(), coins: 100 });
  const reward = Number((await page.locator('#win-coins').textContent()).replace(/\D/g, ''));
  await L.shot(page, D.file('PR-W1-1-level-complete.jpg'));
  const before = L.pick(await L.readSave(page), KEYS);
  await page.locator('#popup-complete [data-action="win-continue"]').click();
  await L.sleep(page, 2500);
  const after = L.pick(await L.readSave(page), KEYS);
  const title = await page.locator('#screen-game .game-top').innerText().catch(() => '');
  await L.shot(page, D.file('PR-W1-2-next-level.jpg'));
  await page.reload(); await L.sleep(page, 2800);
  const reloaded = L.pick(await L.readSave(page), KEYS);
  L.writeJson(D.file('PR-W1-state.json'), { reward_shown: reward, before_continue: before, after_continue: after, after_reload: reloaded });
  check('PR-W1', 'Win + Continue pays the shown reward, saves the stars and opens the next level',
    after.coins === before.coins + reward && JSON.stringify(reloaded.progress) === JSON.stringify(after.progress) && /Level 2/.test(title),
    `coins ${before.coins} -> ${before.coins + reward}, progress kept after reload, Level 2 opens`,
    { coins_after: after.coins, progress_after_reload: reloaded.progress, header: title.replace(/\s+/g, ' ') },
    ['PR-W1-1-level-complete.jpg', 'PR-W1-2-next-level.jpg', 'PR-W1-state.json']);
  await ctx.close();
}

// ---- PR-W2: Level Complete popup dismissed by tapping outside / Escape (2 runs each) ----
for (const [run, how] of [[1, 'tap'], [2, 'tap'], [3, 'escape'], [4, 'escape']].filter(([r]) => L.only('PR-W2', 'PR-W2-' + r))) {
  const ctx = await L.newContext(browser);
  const page = await ctx.newPage(); L.watch(page, log, `PR-W2-${run}`);
  await winFirstLevel(page, { ...L.PLAYER(), coins: 100 });
  const reward = Number((await page.locator('#win-coins').textContent()).replace(/\D/g, ''));
  const before = L.pick(await L.readSave(page), KEYS);
  await L.shot(page, D.file(`PR-W2-run${run}-1-popup.jpg`));
  const rec = run === 1 || run === 3 ? await L.record(page) : null;
  await L.sleep(page, 1200);
  if (how === 'tap') await page.mouse.click(12, 12); else await page.keyboard.press('Escape');
  await L.sleep(page, 2500);
  const popups = await L.visiblePopups(page);
  const after = L.pick(await L.readSave(page), KEYS);
  const nextVisible = await page.locator('[data-action="win-continue"]').isVisible();
  await L.shot(page, D.file(`PR-W2-run${run}-2-after-${how}.jpg`));
  L.writeJson(D.file(`PR-W2-run${run}-state.json`), { how, reward_shown: reward, before, after, popups_after: popups, continue_button_visible: nextVisible });
  check(`PR-W2-${run}`, `Level Complete cannot be dismissed without paying the reward (${how})`,
    popups.includes('popup-complete') || after.coins === before.coins + reward,
    `popup stays open (or reward paid): coins ${before.coins + reward}`,
    { popups_after: popups, coins_after: after.coins, progress: after.progress, continue_visible: nextVisible },
    [`PR-W2-run${run}-1-popup.jpg`, `PR-W2-run${run}-2-after-${how}.jpg`, `PR-W2-run${run}-state.json`, ...(rec ? [`PR-W2-run${run}-${how}.webm`] : [])]);
  if (rec) await rec.stop(D.file(`PR-W2-run${run}-${how}.webm`), run === 1 ? { framesDir: D.file('PR-W2-run1-frames') } : {});
  await ctx.close();
}

// ---- PR-U1/U2: Medium unlocks exactly when all 6 Easy levels are done ----
for (const [id, done] of [['PR-U1', 5], ['PR-U2', 6]].filter(([i]) => L.only(i))) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, id);
  await L.seed(page, { ...L.PLAYER(), progress: { 'flowers-easy': Array(done).fill(3) } });
  await L.openGame(page);
  await page.locator('[data-action="levels"]').first().click(); await L.sleep(page, 800);
  const pills = await page.evaluate(() => ['easy', 'medium', 'hard'].map((d) => ({ diff: d, locked: !document.querySelector('#sec-' + d + ' button.lvl'), playable_tiles: document.querySelectorAll('#sec-' + d + ' button.lvl').length })));
  await L.shot(page, D.file(`${id}-levels-${done}-easy-done.jpg`));
  const medium = pills.find((p) => p.diff === 'medium');
  const want = done < 6;
  check(id, `Medium is ${want ? 'locked' : 'unlocked'} with ${done}/6 Easy levels done`, medium && medium.locked === want,
    `medium locked = ${want}`, { pills }, [`${id}-levels-${done}-easy-done.jpg`]);
  await ctx.close();
}

// ---- PR-D1..D4: daily rewards ----
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d); };
async function claimDaily(page) {
  for (const id of await L.visiblePopups(page)) { if (id === 'popup-offer') await page.keyboard.press('Escape'); } // the daily Special Offer opens on a new day
  await L.sleep(page, 300);
  await page.locator('.side-btn[data-action="activities"]').click(); await L.sleep(page, 600);
  await page.locator('[data-tab="daily"]').click(); await L.sleep(page, 300);
  const disabled = await page.locator('#daily-claim').isDisabled();
  if (!disabled) { await page.locator('#daily-claim').click(); await L.sleep(page, 600); }
  return disabled;
}
if (L.only('PR-D1', 'PR-D2')) {
  // D1: first claim = Day 1 (+500 coins); D2: second claim same day refused
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'PR-D1');
  await L.seed(page, { ...L.PLAYER(), coins: 100, gems: 20 });
  await L.openGame(page);
  const before = L.pick(await L.readSave(page), KEYS);
  await claimDaily(page);
  await L.shot(page, D.file('PR-D1-claimed.jpg'));
  const after = L.pick(await L.readSave(page), KEYS);
  check('PR-D1', 'First daily claim gives Day 1 (+500 coins)', after.coins === before.coins + 500 && after.daily.streak === 1,
    'coins +500, streak 1', { before: before.coins, after: after.coins, daily: after.daily }, ['PR-D1-claimed.jpg']);
  await page.reload(); await L.sleep(page, 2800);
  const disabled = await claimDaily(page);
  const again = L.pick(await L.readSave(page), KEYS);
  await L.shot(page, D.file('PR-D2-same-day.jpg'));
  check('PR-D2', 'Second claim on the same day is refused (also after reload)', disabled && again.coins === after.coins,
    'button disabled, coins unchanged', { disabled, coins: again.coins }, ['PR-D2-same-day.jpg']);
  await ctx.close();
}
if (L.only('PR-D3')) {
  // D3: claimed yesterday (streak 1) -> today gives Day 2 (+50 gems)
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'PR-D3');
  await L.seed(page, { ...L.PLAYER(), gems: 20, daily: { streak: 1, last: daysAgo(1) } });
  await L.openGame(page);
  await claimDaily(page);
  const s = L.pick(await L.readSave(page), KEYS);
  await L.shot(page, D.file('PR-D3-day2.jpg'));
  check('PR-D3', 'Streak continues: claimed yesterday -> Day 2 (+50 gems)', s.gems === 70 && s.daily.streak === 2,
    'gems 20 -> 70, streak 2', { gems: s.gems, daily: s.daily }, ['PR-D3-day2.jpg']);
  await ctx.close();
}
if (L.only('PR-D4')) {
  // D4: last claim 3 days ago (streak 4) -> streak restarts at Day 1
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'PR-D4');
  await L.seed(page, { ...L.PLAYER(), coins: 100, daily: { streak: 4, last: daysAgo(3) } });
  await L.openGame(page);
  await claimDaily(page);
  const s = L.pick(await L.readSave(page), KEYS);
  check('PR-D4', 'Missed days restart the streak at Day 1 (+500 coins)', s.coins === 600 && s.daily.streak === 1,
    'coins 100 -> 600, streak 1', { coins: s.coins, daily: s.daily }, []);
  await ctx.close();
}
if (L.only('PR-D5')) {
  // D5: day 7 chest then next day starts over at Day 1
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'PR-D5');
  await L.seed(page, { ...L.PLAYER(), coins: 100, gems: 20, daily: { streak: 6, last: daysAgo(1) } });
  await L.openGame(page);
  await claimDaily(page);
  const s7 = L.pick(await L.readSave(page), KEYS);
  await L.shot(page, D.file('PR-D5-day7.jpg'));
  // next day: move the last claim back one day in the save (same effect as the calendar moving on; a fake clock stalls the loader)
  const saved = await L.readSave(page);
  await L.seed(page, { ...saved, daily: { ...saved.daily, last: daysAgo(1) }, offer: { seen: L.today(), ends: 0 } });
  await L.openGame(page);
  await claimDaily(page);
  const s8 = L.pick(await L.readSave(page), KEYS);
  check('PR-D5', 'Day 7 gives the chest (+300 gems, +5,000 coins); the next day starts again at Day 1', s7.gems === 320 && s7.coins === 5100 && s8.coins === 5600 && s8.daily.streak === 8,
    'day 7: gems 320 / coins 5100; next day: coins 5600', { day7: { gems: s7.gems, coins: s7.coins }, day8: { coins: s8.coins, daily: s8.daily } }, ['PR-D5-day7.jpg']);
  await ctx.close();
}

// ---- PR-T1: a task cannot be claimed before its goal; claim once when reached ----
if (L.only('PR-T1')) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'PR-T1');
  await L.seed(page, { ...L.PLAYER(), coins: 100, tasks: { day: L.today(), progress: { play3: 2, boosters2: 2 }, claimed: {} } });
  await L.openGame(page);
  await page.locator('.side-btn[data-action="activities"]').click(); await L.sleep(page, 500);
  await page.locator('[data-tab="tasks"]').click(); await L.sleep(page, 400);
  const states = await page.evaluate(() => [...document.querySelectorAll('[data-action="claim-task"]')].map((b) => ({ task: b.dataset.task, disabled: b.disabled })));
  await L.shot(page, D.file('PR-T1-tasks.jpg'));
  await page.locator('[data-task="boosters2"]').dblclick(); await L.sleep(page, 600);
  const s = L.pick(await L.readSave(page), ['coins', 'tasks']);
  check('PR-T1', 'Unfinished task (2/3) is disabled; finished task pays once even when double-tapped', states.find((x) => x.task === 'play3').disabled && s.coins === 250,
    'play3 disabled; coins 100 -> 250 (+150 once)', { buttons: states, coins: s.coins, claimed: s.tasks.claimed }, ['PR-T1-tasks.jpg']);
  await ctx.close();
}

// ---- PR-S1/S2: corrupted saves ----
if (L.only('PR-S1')) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'PR-S1');
  await L.seed(page, { ...L.PLAYER(), coins: 4321 });
  await page.evaluate((k) => { localStorage.setItem(k + '.backup', localStorage.getItem(k)); localStorage.setItem(k, '{"v":2,"data":'); }, L.SAVE_KEY);
  await L.openGame(page);
  const coins = await page.locator('.ui-coins, #ui-coins').first().textContent().catch(() => null);
  const errors = log.filter((l) => l.startsWith('[PR-S1]') && /pageerror/.test(l));
  await L.shot(page, D.file('PR-S1-backup-used.jpg'));
  check('PR-S1', 'Broken main save: game loads the backup slot', /4,?321|4\.3K/.test(coins || '') && !errors.length, 'coins 4321 from backup, no errors', { coins_shown: coins, errors }, ['PR-S1-backup-used.jpg']);
  await ctx.close();
}
if (L.only('PR-S2')) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'PR-S2');
  await page.goto(L.BASE + 'package.json');
  await page.evaluate((k) => { localStorage.setItem(k, 'garbage'); localStorage.setItem(k + '.backup', '{{{'); }, L.SAVE_KEY);
  await L.openGame(page);
  await page.locator('#popup-age').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}); // opens when the loading screen ends
  const popups = await L.visiblePopups(page);
  const errors = log.filter((l) => l.startsWith('[PR-S2]') && /pageerror/.test(l));
  await L.shot(page, D.file('PR-S2-both-broken.jpg'));
  check('PR-S2', 'Both save slots broken: game starts fresh without crashing', popups.includes('popup-age') && !errors.length, 'fresh start (age gate), no errors', { popups, errors }, ['PR-S2-both-broken.jpg']);
  await ctx.close();
}

await browser.close();
L.saveResults(D.file('results.json'), results);
L.writeJson(D.file('console.json'), log);
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} passed`);
