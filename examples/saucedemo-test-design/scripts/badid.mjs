// Exploration script for the test-design run on SauceDemo.
// Product pages with IDs that do not exist. Output: inventory/observations-3.txt
// Run from examples/saucedemo-test-design with playwright-core installed: node scripts/badid.mjs
import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'msedge' }); const p = await b.newPage();
await p.goto('https://www.saucedemo.com/'); await p.fill('#user-name','standard_user'); await p.fill('#password','secret_sauce'); await p.click('#login-button');
for (const id of ['99','-1','abc']) { await p.goto('https://www.saucedemo.com/inventory-item.html?id='+id); await p.waitForTimeout(500);
 const name = await p.locator('[data-test="inventory-item-name"]').innerText().catch(()=>'-'); const price = await p.locator('[data-test="inventory-item-price"]').innerText().catch(()=>'-');
 const add = await p.locator('button[data-test^="add-to-cart"]').count(); console.log('id', id, '|', name, '|', price, '| add buttons', add); }
await p.click('button[data-test^="add-to-cart"]').catch(e=>console.log('no add')); console.log('badge', await p.locator('[data-test="shopping-cart-badge"]').innerText().catch(()=>'none'));
await b.close();
