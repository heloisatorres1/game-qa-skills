// BUG-008 evidence: player XP / level never grows from play.
// Run 1: the save after the 102-level playthrough (persistent profile). Run 2: a fresh player wins 3 levels.
//   PROFILE_DIR=.state/profile node scripts/xp-check.mjs
import fs from 'node:fs';
import path from 'node:path';
import * as L from '../../pixel-swarm-full/scripts/lib.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const EV = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', 'evidence');
const out = {};
const pick = (s) => ({ playerLevel: s.playerLevel, xp: s.xp, xpToNext: s.xpToNext, levels_won: s.stats.levels, firefly_owned: s.ownedSkins.includes('firefly') });

// ---- run 1: after the full playthrough ----
{
  const ctx = await chromium.launchPersistentContext(process.env.PROFILE_DIR, { channel: 'msedge', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = ctx.pages()[0] || await ctx.newPage();
  await L.openGame(page);
  const rec = await L.record(page);
  await L.sleep(page, 1200);
  await page.locator('[data-action="profile"]:visible').first().click({ force: true }); await L.sleep(page, 1500);
  await page.screenshot({ path: path.join(EV, 'BUG-008-1-profile-after-102-wins.jpg'), type: 'jpeg', quality: 70 });
  await page.keyboard.press('Escape'); await L.sleep(page, 500);
  await page.locator('.nav-btn[data-action="skins"]').click(); await L.sleep(page, 900);
  await page.locator('[data-action="skin-view"][data-skin="firefly"]').click(); await L.sleep(page, 1400);
  await page.screenshot({ path: path.join(EV, 'BUG-008-2-firefly-locked.jpg'), type: 'jpeg', quality: 70 });
  await L.sleep(page, 800);
  await rec.stop(path.join(EV, 'BUG-008-after-102-wins.webm'));
  out.run1_after_playthrough = pick(await L.readSave(page));
  await ctx.close();
}

// ---- run 2: a fresh player wins 3 levels (auto-solve at 5x is fine here: only the XP after a win matters) ----
{
  const browser = await L.launch(); const ctx = await L.newContext(browser); const page = await ctx.newPage();
  await L.seed(page, { ...L.PLAYER(), tutorialSeen: true });
  out.run2 = [];
  for (let i = 0; i < 3; i++) {
    await L.openGame(page, 'game');
    await L.cheat(page, 'speed'); await L.cheat(page, 'solve');
    await page.locator('#popup-complete').waitFor({ state: 'visible', timeout: 240000 }); await L.sleep(page, 1200);
    await page.locator('#popup-complete [data-action="win-continue"]').click(); await L.sleep(page, 1500);
    out.run2.push(pick(await L.readSave(page)));
  }
  await browser.close();
}
fs.writeFileSync(path.join(EV, 'BUG-008-state.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
