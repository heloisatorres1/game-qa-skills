// Exploration script for the test-design run on SauceDemo.
// Logs in and out, tries every login and checkout error, sorting, totals and reset. Output: inventory/observations.json
// Run from examples/saucedemo-test-design with playwright-core installed: node scripts/explore.mjs
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const b = await chromium.launch({ channel: 'msedge' });
const ctx = await b.newContext(); const p = await ctx.newPage();
const out = {};
const err = async () => (await p.locator('[data-test="error"]').count()) ? (await p.locator('[data-test="error"]').innerText()) : null;
async function login(u, pw) { await p.goto('https://www.saucedemo.com/'); if (u!==null) await p.fill('#user-name', u); if (pw!==null) await p.fill('#password', pw); await p.click('#login-button'); await p.waitForTimeout(300); return { url: p.url(), error: await err() }; }
out.loginText = await (async()=>{await p.goto('https://www.saucedemo.com/'); return (await p.locator('.login_credentials_wrap').innerText()).replace(/\n+/g,' | ');})();
out.empty = await login(null, null);
out.noPassword = await login('standard_user', null);
out.wrong = await login('standard_user', 'wrong_pass');
out.unknown = await login('nobody', 'secret_sauce');
out.locked = await login('locked_out_user', 'secret_sauce');
out.caseUser = await login('Standard_User', 'secret_sauce');
out.spaces = await login(' standard_user ', 'secret_sauce');
await ctx.clearCookies(); await p.goto('https://www.saucedemo.com/inventory.html'); await p.waitForTimeout(300);
out.deepLinkLoggedOut = { url: p.url(), error: await err() };
await login('standard_user','secret_sauce');
out.products = await p.locator('[data-test="inventory-item-name"]').allInnerTexts();
out.prices = await p.locator('[data-test="inventory-item-price"]').allInnerTexts();
out.menu = (await p.locator('.bm-item-list a').allInnerTexts());
for (const v of ['az','za','lohi','hilo']) { await p.selectOption('[data-test="product-sort-container"]', v); out['sort_'+v] = (await p.locator('[data-test="inventory-item-name"]').allInnerTexts())[0] + ' / ' + (await p.locator('[data-test="inventory-item-price"]').allInnerTexts())[0]; }
await p.click('[data-test="shopping-cart-link"]'); await p.click('[data-test="checkout"]');
out.emptyCartCheckoutUrl = p.url();
await p.click('[data-test="continue"]'); out.co_empty = await err();
await p.fill('[data-test="firstName"]','Ana'); await p.click('[data-test="continue"]'); out.co_noLast = await err();
await p.fill('[data-test="lastName"]','Silva'); await p.click('[data-test="continue"]'); out.co_noZip = await err();
await p.fill('[data-test="postalCode"]','86000'); await p.click('[data-test="continue"]'); out.co_emptyCart_step2 = { url: p.url(), total: await p.locator('[data-test="total-label"]').innerText(), sub: await p.locator('[data-test="subtotal-label"]').innerText(), tax: await p.locator('[data-test="tax-label"]').innerText() };
await p.click('[data-test="finish"]'); out.emptyCartFinish = { url: p.url(), h: await p.locator('h2').innerText() };
await p.goto('https://www.saucedemo.com/inventory.html');
for (let i = 0; i < 6; i++) await p.locator('button[data-test^="add-to-cart"]').first().click();
out.badgeAll = await p.locator('[data-test="shopping-cart-badge"]').innerText();
await p.goto('https://www.saucedemo.com/checkout-step-one.html');
await p.fill('[data-test="firstName"]','   '); await p.fill('[data-test="lastName"]','   '); await p.fill('[data-test="postalCode"]','   '); await p.click('[data-test="continue"]');
out.co_spacesOnly = { url: p.url(), error: await err() };
if (p.url().includes('step-two')) out.allItemsTotals = { sub: await p.locator('[data-test="subtotal-label"]').innerText(), tax: await p.locator('[data-test="tax-label"]').innerText(), total: await p.locator('[data-test="total-label"]').innerText() };
await p.goto('https://www.saucedemo.com/inventory.html');
await p.click('#react-burger-menu-btn'); await p.click('#reset_sidebar_link'); await p.waitForTimeout(300);
out.afterReset = { badge: await p.locator('[data-test="shopping-cart-badge"]').count(), removeButtons: await p.locator('button[data-test^="remove"]').count() };
await p.click('#logout_sidebar_link');
await p.waitForTimeout(300); out.logoutUrl = p.url(); await p.goBack(); await p.waitForTimeout(400); out.backAfterLogout = { url: p.url(), error: await err() };
await login('standard_user','secret_sauce');
await p.click('[data-test="add-to-cart-sauce-labs-backpack"]'); await p.click('[data-test="add-to-cart-sauce-labs-bike-light"]');
await p.goto('https://www.saucedemo.com/checkout-step-one.html');
await p.fill('[data-test="firstName"]','Ana'); await p.fill('[data-test="lastName"]','Silva'); await p.fill('[data-test="postalCode"]','86000'); await p.click('[data-test="continue"]');
out.twoItems = { sub: await p.locator('[data-test="subtotal-label"]').innerText(), tax: await p.locator('[data-test="tax-label"]').innerText(), total: await p.locator('[data-test="total-label"]').innerText() };
await p.goto('https://www.saucedemo.com/checkout-step-one.html');
await p.fill('[data-test="firstName"]','A'.repeat(1000)); out.longNameLen = (await p.inputValue('[data-test="firstName"]')).length;
fs.writeFileSync('explore.json', JSON.stringify(out,null,2)); console.log(JSON.stringify(out,null,2));
await b.close();
