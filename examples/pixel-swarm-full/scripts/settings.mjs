// test-settings: defaults, toggles apply + persist, audio checked through the audio engine state, player id / version.
import * as L from './lib.mjs';

const D = L.dirs('test-settings');
const results = [];
const log = [];
const check = (id, name, pass, expected, actual, evidence = []) => { const r = { id, name, pass, expected, actual, evidence }; results.push(r); L.saveResults(D.file('results.json'), [r]); console.log(pass ? 'PASS' : 'FAIL', id, name, '|', JSON.stringify(actual)); };
const browser = await L.launch();
const KEYS = ['music', 'sounds', 'haptics', 'notifications'];
const toggles = (page) => page.evaluate((keys) => Object.fromEntries(keys.map((k) => [k, document.querySelector(`#popup-settings [data-toggle="${k}"]`)?.getAttribute('aria-pressed')])), KEYS);
const openSettings = async (page) => { await page.locator('[data-action="settings"]').first().click(); await L.sleep(page, 500); };

// SE-01..04: defaults, toggle off, persistence, UI matches state
{
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'SE');
  await L.seed(page, L.PLAYER());
  await L.openGame(page);
  await openSettings(page);
  const def = { ui: await toggles(page), state: (await L.readSave(page)).settings };
  await L.shot(page, D.file('SE-01-defaults.jpg'));
  check('SE-01', 'Defaults: all four switches on, UI matches the save', KEYS.every((k) => def.ui[k] === 'true' && def.state[k] === true), 'all true', def, ['SE-01-defaults.jpg']);
  for (const k of KEYS) { await page.locator(`#popup-settings [data-toggle="${k}"]`).click(); await L.sleep(page, 250); }
  const off = { ui: await toggles(page), state: (await L.readSave(page)).settings };
  await L.shot(page, D.file('SE-02-all-off.jpg'));
  check('SE-02', 'Each switch turns off immediately (UI and save)', KEYS.every((k) => off.ui[k] === 'false' && off.state[k] === false), 'all false', off, ['SE-02-all-off.jpg']);
  await page.reload(); await L.sleep(page, 2800);
  await openSettings(page);
  const re = { ui: await toggles(page), state: (await L.readSave(page)).settings };
  await L.shot(page, D.file('SE-03-after-reload.jpg'));
  check('SE-03', 'Switches stay off after reload, UI shows the stored value', KEYS.every((k) => re.ui[k] === 'false' && re.state[k] === false), 'all false after reload', re, ['SE-03-after-reload.jpg']);
  const id = await page.locator('#ui-player-id').textContent();
  const ver = await page.locator('#ui-version').textContent();
  check('SE-04', 'Player ID and version shown match the save and the build', id === 'TEST-0001' && ver.trim() === '1.0.0', 'TEST-0001 / 1.0.0', { id, ver }, ['SE-03-after-reload.jpg']);
  await ctx.close();
}

// SE-05/06: Sounds switch really silences effects (audio engine counters, not ears)
for (const [id, on] of [['SE-05', false], ['SE-06', true]]) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, id);
  await L.seed(page, { ...L.PLAYER(), settings: { music: on, sounds: on, haptics: true, notifications: true } });
  await L.openGame(page, 'game');
  await page.mouse.click(195, 300); await L.sleep(page, 300); // first tap unlocks audio in the browser
  const before = await page.evaluate(() => window.PSAudio.debug());
  const blocks = page.locator('[data-action="tap-block"]');
  for (let i = 0; i < 3; i++) { if (await blocks.count()) { await blocks.first().click(); await L.sleep(page, 700); } }
  const after = await page.evaluate(() => window.PSAudio.debug());
  // effects only: musicSteps counts music notes, which keep being scheduled on a muted bus
  const sum = (o) => Object.entries(o.played || {}).filter(([k]) => k !== 'musicSteps').reduce((a, [, b]) => a + b, 0);
  L.writeJson(D.file(`${id}-audio.json`), { sounds_setting: on, before, after });
  check(id, `Sounds ${on ? 'on' : 'off'}: tapping blocks ${on ? 'plays' : 'plays no'} effects`, on ? sum(after) > sum(before) : sum(after) === sum(before),
    on ? 'effect counter increases' : 'effect counter unchanged', { audio_state: after.state, effects_before: sum(before), effects_after: sum(after), music: after.music }, [`${id}-audio.json`]);
  await ctx.close();
}

// SE-07: Copy player ID
{
  const ctx = await L.newContext(browser); await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: L.BASE });
  const page = await ctx.newPage(); L.watch(page, log, 'SE-07');
  await L.seed(page, L.PLAYER());
  await L.openGame(page);
  await openSettings(page);
  await page.locator('#popup-settings [data-action="copy-id"], #popup-settings button:has-text("Copy")').first().click(); await L.sleep(page, 400);
  const clip = await page.evaluate(() => navigator.clipboard.readText()).catch((e) => 'read failed: ' + e.message);
  const toast = await page.evaluate(() => document.getElementById('toast').textContent);
  await L.shot(page, D.file('SE-07-copy-id.jpg'));
  check('SE-07', 'Copy puts the player ID on the clipboard and confirms', clip === 'TEST-0001' && /copied/i.test(toast), 'clipboard = TEST-0001, "Copied!"', { clip, toast }, ['SE-07-copy-id.jpg']);
  await ctx.close();
}

await browser.close();
L.saveResults(D.file('results.json'), results);
L.writeJson(D.file('console.json'), log);
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} passed`);
