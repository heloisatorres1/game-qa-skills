// test-store: catalogue purchases with state deltas, edge cases, ownership, free coins, skins, speed store.
import * as L from './lib.mjs';

const D = L.dirs('test-store');
const results = [];
const log = [];
const check = (id, name, pass, expected, actual, evidence = []) => { const r = { id, name, pass, expected, actual, evidence }; results.push(r); L.saveResults(D.file('results.json'), [r]); console.log(pass ? 'PASS' : 'FAIL', id, name, '|', JSON.stringify(actual)); };
const browser = await L.launch();
const KEYS = ['coins', 'gems', 'noAds', 'ownedSkins', 'creature', 'maxSpeed', 'speedBoostUntil', 'freeCoins'];

async function store(seedData, { video = false, tag } = {}) {
  const ctx = await L.newContext(browser);
  const page = await ctx.newPage(); L.watch(page, log, tag);
  await L.seed(page, { ...L.PLAYER(), ...seedData });
  await L.openGame(page);
  await page.locator('.nav-btn[data-action="store"]').click(); await L.sleep(page, 700);
  return { ctx, page };
}
const toastText = (page) => page.evaluate(() => (document.getElementById('toast') || {}).textContent || '');
const buyBtn = (page, item) => page.locator(`#store-list [data-action="buy"][data-item="${item}"]`);

// ST-01..05: each catalogue item with exact deltas
const cases = [
  ['ST-01', 'Gem pack S (test purchase): +100 gems', { gems: 20, coins: 100 }, 'gems-s', { gems: 120, coins: 100 }],
  ['ST-02', 'Gem pack L (test purchase): +1,200 gems', { gems: 20, coins: 100 }, 'gems-l', { gems: 1220, coins: 100 }],
  ['ST-03', 'Coin pack S with enough gems: -30 gems, +1,000 coins', { gems: 120, coins: 100 }, 'coins-s', { gems: 90, coins: 1100 }],
  ['ST-04', 'Coin pack S with exactly 30 gems: balance reaches 0', { gems: 30, coins: 100 }, 'coins-s', { gems: 0, coins: 1100 }],
  ['ST-05', 'Coin pack L with 100 gems (needs 250): refused, nothing changes', { gems: 100, coins: 100 }, 'coins-l', { gems: 100, coins: 100 }],
];
for (const [id, name, start, item, want] of cases.filter(([i]) => L.only(i))) {
  const { ctx, page } = await store(start, { tag: id });
  const before = L.pick(await L.readSave(page), KEYS);
  await buyBtn(page, item).scrollIntoViewIfNeeded();
  await buyBtn(page, item).click(); await L.sleep(page, 400);
  const toast = await toastText(page);
  await L.shot(page, D.file(`${id}-after.jpg`));
  await page.reload(); await L.sleep(page, 2800);
  const after = L.pick(await L.readSave(page), KEYS);
  L.writeJson(D.file(`${id}-state.json`), { item, before: L.pick(before, ['gems', 'coins']), expected: want, after_reload: L.pick(after, ['gems', 'coins']), toast });
  check(id, name, after.gems === want.gems && after.coins === want.coins, want, { gems: after.gems, coins: after.coins, toast }, [`${id}-after.jpg`, `${id}-state.json`]);
  await ctx.close();
}

// ST-06: double-tap on a gem-priced coin pack
if (L.only('ST-06')) {
  const { ctx, page } = await store({ gems: 120, coins: 100 }, { tag: 'ST-06' });
  await buyBtn(page, 'coins-s').scrollIntoViewIfNeeded();
  await buyBtn(page, 'coins-s').dblclick(); await L.sleep(page, 500);
  const s = L.pick(await L.readSave(page), KEYS);
  await L.shot(page, D.file('ST-06-double-tap.jpg'));
  check('ST-06', 'Double-tap on a coin pack (no confirm step): records how many packs are bought', true, 'documented', { gems: s.gems, coins: s.coins, packs_bought: (120 - s.gems) / 30 }, ['ST-06-double-tap.jpg']);
  await ctx.close();
}

// ST-07: No Ads purchase -> owned, banner gone in a level
if (L.only('ST-07')) {
  const { ctx, page } = await store({ gems: 20, coins: 100 }, { tag: 'ST-07' });
  await buyBtn(page, 'noAds').click(); await L.sleep(page, 500);
  const label = await page.locator('#store-list .card:has(.card-title:has-text("No Ads")) button').first().innerText();
  await L.shot(page, D.file('ST-07-1-noads-owned.jpg'));
  await L.openGame(page, 'game');
  const banner = await page.locator('#g-ad').isVisible();
  await L.shot(page, D.file('ST-07-2-level-no-banner.jpg'));
  const s = L.pick(await L.readSave(page), KEYS);
  check('ST-07', 'No Ads: card shows Owned, the level has no ad banner, survives reload', s.noAds === true && /owned/i.test(label) && !banner,
    'noAds true, "Owned", banner hidden', { noAds: s.noAds, button: label, banner_visible: banner }, ['ST-07-1-noads-owned.jpg', 'ST-07-2-level-no-banner.jpg']);
  await ctx.close();
}

// ST-08: Special Offer (includes No Ads) after No Ads is owned (2 runs, video)
for (const run of [1, 2].filter((r) => L.only('ST-08', 'ST-08-' + r))) {
  const { ctx, page } = await store({ gems: 20, coins: 100, noAds: true }, { video: true, tag: `ST-08-${run}` });
  const offer = page.locator('#store-list [data-item="offer"]');
  const offerVisible = await offer.isVisible();
  const offerText = await page.locator('#store-list .offer').innerText().catch(() => '');
  await L.shot(page, D.file(`ST-08-run${run}-1-offer-still-sold.jpg`));
  await page.locator('#store-list .offer').screenshot({ path: D.file(`ST-08-run${run}-crop.png`) });
  const before = L.pick(await L.readSave(page), KEYS);
  const rec = run === 1 ? await L.record(page) : null;
  await L.sleep(page, 1000);
  if (offerVisible) { await offer.click(); await L.sleep(page, 400); }
  const toast = await toastText(page);
  await L.shot(page, D.file(`ST-08-run${run}-2-bought-again.jpg`));
  const after = L.pick(await L.readSave(page), KEYS);
  L.writeJson(D.file(`ST-08-run${run}-state.json`), { before: L.pick(before, ['gems', 'coins', 'noAds']), after: L.pick(after, ['gems', 'coins', 'noAds']), offer_card_text: offerText, toast });
  check(`ST-08-${run}`, 'Special Offer is not sold again for its No Ads part once No Ads is owned', !offerVisible,
    'offer hidden or re-priced without No Ads', { offer_visible: offerVisible, offer_text: offerText.replace(/\s+/g, ' '), toast, before: L.pick(before, ['gems', 'coins']), after: L.pick(after, ['gems', 'coins']) },
    [`ST-08-run${run}-crop.png`, `ST-08-run${run}-1-offer-still-sold.jpg`, `ST-08-run${run}-2-bought-again.jpg`, `ST-08-run${run}-state.json`, ...(run === 1 ? [`ST-08-run${run}.webm`] : [])]);
  await L.sleep(page, 1200);
  if (rec) await rec.stop(D.file(`ST-08-run${run}.webm`));
  await ctx.close();
}

// ST-09: Free coins: 5 per day, then refused
if (L.only('ST-09')) {
  const { ctx, page } = await store({ gems: 20, coins: 100 }, { tag: 'ST-09' });
  const btn = page.locator('#store-list [data-action="free-coins"]');
  await btn.scrollIntoViewIfNeeded();
  const enabledPerTry = [];
  for (let i = 0; i < 6; i++) {
    const enabled = await btn.isEnabled();
    enabledPerTry.push(enabled);
    if (enabled) { await btn.click(); await L.sleep(page, 3600); }
  }
  const toast = enabledPerTry.join(',');
  const s = L.pick(await L.readSave(page), KEYS);
  const label = await page.locator('#store-list .card:has([data-action="free-coins"])').innerText();
  await L.shot(page, D.file('ST-09-free-coins-limit.jpg'));
  check('ST-09', 'Free Coins: 5 ads per day (+100 each), the 6th is refused', s.coins === 600 && s.freeCoins.count === 5,
    'coins 100 -> 600, count 5, 6th refused', { coins: s.coins, freeCoins: s.freeCoins, toast, card: label.replace(/\s+/g, ' ') }, ['ST-09-free-coins-limit.jpg']);
  await ctx.close();
}

// ST-10..12: Bugs (skins): buy with gems, insufficient gems, level lock
async function skins(seedData, tag) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, tag);
  await L.seed(page, { ...L.PLAYER(), ...seedData });
  await L.openGame(page);
  await page.locator('.nav-btn[data-action="skins"], .nav-btn[data-screen="skins"]').first().click(); await L.sleep(page, 700);
  return { ctx, page };
}
for (const [id, name, start, skin, want] of [
  ['ST-10', 'Ladybug with 200 gems (price 150): bought, equipped, 50 gems left', { gems: 200 }, 'ladybug', { gems: 50, owned: true }],
  ['ST-11', 'Beetle with 100 gems (price 200): refused', { gems: 100 }, 'beetle', { gems: 100, owned: false }],
  ['ST-12', 'Firefly with 1,000 gems at player level 1 (needs level 5): refused', { gems: 1000, playerLevel: 1 }, 'firefly', { gems: 1000, owned: false }],
].filter(([i]) => L.only(i))) {
  const { ctx, page } = await skins(start, id);
  await page.locator(`[data-action="skin-view"][data-skin="${skin}"]`).click(); await L.sleep(page, 400);
  const buy = page.locator(`[data-action="skin-buy"][data-skin="${skin}"]`);
  const hasBuy = await buy.count();
  if (hasBuy) { await buy.first().dblclick(); await L.sleep(page, 500); }
  await L.shot(page, D.file(`${id}-${skin}.jpg`));
  const s = L.pick(await L.readSave(page), KEYS);
  const owned = s.ownedSkins.includes(skin);
  check(id, name, s.gems === want.gems && owned === want.owned, want, { gems: s.gems, owned, creature: s.creature, buy_button: !!hasBuy }, [`${id}-${skin}.jpg`]);
  await ctx.close();
}

// ST-13/14: Speed Store: coin boost and gem tier
if (L.only('ST-13', 'ST-14')) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'ST-13');
  await L.seed(page, { ...L.PLAYER(), coins: 300, gems: 120 });
  await L.openGame(page, 'game');
  await page.locator('[data-action="speed"]').first().click(); await L.sleep(page, 600);
  await page.locator('[data-action="sp-boost"][data-i="1"]').click(); await L.sleep(page, 400);
  await page.locator('[data-action="sp-tier"][data-i="0"]').click(); await L.sleep(page, 400);
  await L.shot(page, D.file('ST-13-speed-store.jpg'));
  const s = L.pick(await L.readSave(page), KEYS);
  const mins = Math.round((s.speedBoostUntil - Date.now()) / 60000);
  check('ST-13', 'Speed Store: +5 min boost for 250 coins, 3x tier for 100 gems', s.coins === 50 && s.gems === 20 && s.maxSpeed === 3 && mins >= 4 && mins <= 5,
    'coins 300 -> 50, gems 120 -> 20, maxSpeed 3, ~5 min boost', { coins: s.coins, gems: s.gems, maxSpeed: s.maxSpeed, boost_minutes_left: mins }, ['ST-13-speed-store.jpg']);
  await page.locator('[data-action="sp-boost"][data-i="3"]').click(); await L.sleep(page, 400);
  const t = L.pick(await L.readSave(page), KEYS);
  check('ST-14', 'Speed Store: 30 min boost (1,000 coins) with 50 coins is refused', t.coins === 50, 'coins stay 50', { coins: t.coins, toast: await toastText(page) }, []);
  await ctx.close();
}

await browser.close();
L.saveResults(D.file('results.json'), results);
L.writeJson(D.file('console.json'), log);
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} passed`);
