// Captures in-game evidence for the Pixel Swarm text review.
// Usage: node scripts/session.mjs [base-url]   (default http://localhost:5199/)
// Needs playwright-core and Microsoft Edge (or set BROWSER_CHANNEL=chrome).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RUN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EV = path.join(RUN, 'evidence');
const BASE = process.argv[2] || 'http://localhost:5199/';
fs.mkdirSync(EV, { recursive: true });

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const log = [];
const watchHttp = (c) => c.on('response', (r) => { if (r.status() >= 400) log.push(`[http ${r.status()}] ${new URL(r.url()).pathname}`); });
watchHttp(ctx);
const shot = (page, name) => page.screenshot({ path: path.join(EV, name), type: 'jpeg', quality: 82 });
const wait = (page, ms) => page.waitForTimeout(ms);

async function open(hash) {
  const page = await ctx.newPage();
  page.on('console', (m) => log.push(`[${hash || 'boot'}] [${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => log.push(`[${hash || 'boot'}] [pageerror] ${e.message}`));
  await page.goto(BASE + (hash ? '#' + hash : ''));
  await wait(page, 2500);
  return page;
}

// 1. Boot / loading screen (fresh save)
{
  const page = await ctx.newPage();
  page.on('console', (m) => log.push(`[boot] [${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => log.push(`[boot] [pageerror] ${e.message}`));
  await page.goto(BASE);
  await wait(page, 600);
  await shot(page, 'TXT-loading.jpg');
  await page.close();
}

// 2. How to Play popup
{
  const page = await open('howto');
  await shot(page, 'TXT-howto.jpg');
  await page.close();
}

// 3. Booster popup (Shuffle description)
{
  const page = await open('booster_popup');
  await wait(page, 800);
  await shot(page, 'TXT-booster-shuffle.jpg');
  await page.close();
}

// 4. Tutorial, first steps
{
  const page = await open('tutorial');
  await wait(page, 1200);
  await shot(page, 'TXT-tutorial-1.jpg');
  // close-up of the bottom banner, where the tutorial dots are drawn
  await page.screenshot({ path: path.join(EV, 'TXT-tutorial-dots-crop.png'), clip: { x: 0, y: 844 - 70, width: 390, height: 70 } });
  await page.close();
}

// 5. First launch on a clean profile: age gate, legal links, then the store (test build purchase toast)
{
  const fresh = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  watchHttp(fresh);
  const page = await fresh.newPage();
  page.on('console', (m) => log.push(`[first-launch] [${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => log.push(`[first-launch] [pageerror] ${e.message}`));
  await page.goto(BASE);
  await page.locator('#popup-age').waitFor({ state: 'visible', timeout: 15000 });
  await shot(page, 'TXT-age-gate.jpg');
  await page.locator('#popup-age [data-link="privacy"]').click();
  await wait(page, 300);
  await shot(page, 'TXT-privacy-toast.jpg');
  await page.locator('[data-age="18+"]').click();
  await page.locator('#age-confirm').click();
  // story cutscene (first launch only)
  await page.locator('#cutscene').waitFor({ state: 'visible', timeout: 10000 });
  await wait(page, 1500);
  await shot(page, 'TXT-story-1.jpg');
  await page.locator('[data-action="story-skip"]').click();
  await page.locator('#popup-welcome').waitFor({ state: 'visible', timeout: 10000 });
  await wait(page, 600);
  await shot(page, 'TXT-welcome.jpg');
  await page.close();

  // Store: same profile, opened through a dev hash (skips the first-level flow)
  const store = await fresh.newPage();
  store.on('console', (m) => log.push(`[store] [${m.type()}] ${m.text()}`));
  store.on('pageerror', (e) => log.push(`[store] [pageerror] ${e.message}`));
  await store.goto(BASE + '#menu');
  await wait(store, 2500);
  await runStore(store);
  await fresh.close();
}

async function runStore(page) {
  await page.locator('.nav-btn[data-action="store"]').click();
  await wait(page, 800);
  await shot(page, 'TXT-store.jpg');
  await page.setViewportSize({ width: 360, height: 740 });
  await wait(page, 500);
  await page.locator('.card .card-title').first().screenshot({ path: path.join(EV, 'TXT-store-noads-360.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await wait(page, 500);
  const gems = page.locator('[data-action="buy"][data-item^="gems"]').first();
  if (await gems.count()) { await gems.click(); await wait(page, 400); await shot(page, 'TXT-store-test-purchase.jpg'); }
  await page.close();
}

// 6. Numbers promised in text vs. data
{
  const page = await open('');
  const facts = await page.evaluate(() => {
    const D = window.PS_DATA;
    const L = window.PS_LEVELS;
    const themes = D.THEMES.map((t) => t.id);
    return {
      themes,
      difficulties: D.DIFFICULTIES,
      levels_per_difficulty: D.LEVELS_PER_DIFFICULTY,
      event_levels: D.EVENT.levels,
      gallery_total: themes.length * D.DIFFICULTIES.length * D.LEVELS_PER_DIFFICULTY + D.EVENT.levels,
      halloween_pictures: (L.halloween || []).length,
    };
  });
  fs.writeFileSync(path.join(EV, 'TXT-data-facts.json'), JSON.stringify(facts, null, 2));
  await page.close();
}

fs.writeFileSync(path.join(EV, 'console.log'), log.join('\n') + '\n');
await browser.close();
console.log('evidence written to', EV);
