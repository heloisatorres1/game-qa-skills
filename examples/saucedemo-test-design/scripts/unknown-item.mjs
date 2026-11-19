// Exploration script for the test-design run on SauceDemo.
// Adds an unknown product to the cart, twice from a clean browser. Output: inventory/observations-4.txt and two screenshots
// Run from examples/saucedemo-test-design with playwright-core installed: node scripts/unknown-item.mjs
import { chromium } from 'playwright-core';
const E = 'inventory/';
for (let run = 1; run <= 2; run++) {
const b = await chromium.launch({ channel: 'msedge' }); const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message.split('\n')[0]));
await p.goto('https://www.saucedemo.com/'); await p.fill('#user-name','standard_user'); await p.fill('#password','secret_sauce'); await p.click('#login-button');
await p.goto('https://www.saucedemo.com/inventory-item.html?id=99');
if (run === 1) await p.screenshot({ path: E + 'unknown-item-1-product-page.jpg', type: 'jpeg', quality: 70 });
await p.click('button[data-test^="add-to-cart"]');
console.log(`run ${run} localStorage cart:`, await p.evaluate(() => localStorage.getItem('cart-contents')));
await p.click('[data-test="shopping-cart-link"]'); await p.waitForTimeout(800);
console.log(`run ${run} cart page url ${p.url()} body text length ${(await p.locator('body').innerText()).trim().length}`);
if (run === 1) await p.screenshot({ path: E + 'unknown-item-2-cart-empty-list.jpg', type: 'jpeg', quality: 70 });
await p.goto('https://www.saucedemo.com/inventory.html'); await p.waitForTimeout(800);
console.log(`run ${run} product list after: items ${await p.locator('[data-test="inventory-item"]').count()}, badge ${await p.locator('[data-test="shopping-cart-badge"]').innerText({timeout:2000}).catch(()=>'none')}`);
console.log(`run ${run} page errors:`, JSON.stringify(errs.slice(0,3)));
await b.close(); }
