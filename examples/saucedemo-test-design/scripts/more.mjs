// Exploration script for the test-design run on SauceDemo.
// Sort persistence, cart after reload and logout, cancel and back paths, login times. Output: inventory/observations-2.txt
// Run from examples/saucedemo-test-design with playwright-core installed: node scripts/more.mjs
import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'msedge' }); const p = await b.newPage();
const login = async (u='standard_user') => { await p.goto('https://www.saucedemo.com/'); await p.fill('#user-name',u); await p.fill('#password','secret_sauce'); await p.click('#login-button'); };
await login();
console.log('about href', await p.locator('#about_sidebar_link').getAttribute('href'));
await p.selectOption('[data-test="product-sort-container"]','lohi');
const names = await p.locator('[data-test="inventory-item-name"]').allInnerTexts(); const pr = await p.locator('[data-test="inventory-item-price"]').allInnerTexts();
console.log('lohi order', names.map((n,i)=>n+' '+pr[i]).join(' | '));
await p.locator('[data-test="inventory-item-name"]').first().click(); await p.click('[data-test="back-to-products"]');
console.log('sort after back', await p.locator('[data-test="product-sort-container"]').inputValue(), (await p.locator('[data-test="inventory-item-name"]').allInnerTexts())[0]);
await p.click('[data-test="add-to-cart-sauce-labs-backpack"]');
await p.reload(); console.log('badge after reload', await p.locator('[data-test="shopping-cart-badge"]').innerText().catch(()=>'none'));
await p.click('#react-burger-menu-btn'); await p.click('#logout_sidebar_link'); await login();
console.log('badge after logout+login', await p.locator('[data-test="shopping-cart-badge"]').innerText().catch(()=>'none'));
await p.click('[data-test="shopping-cart-link"]'); await p.click('[data-test="remove-sauce-labs-backpack"]');
console.log('badge after removing last', await p.locator('[data-test="shopping-cart-badge"]').count());
await p.click('[data-test="continue-shopping"]'); console.log('continue shopping url', p.url());
// finish then back
await p.click('[data-test="add-to-cart-sauce-labs-onesie"]'); await p.goto('https://www.saucedemo.com/checkout-step-one.html');
await p.fill('[data-test="firstName"]','Ana'); await p.fill('[data-test="lastName"]','Silva'); await p.fill('[data-test="postalCode"]','86000'); await p.click('[data-test="continue"]');
console.log('onesie', await p.locator('[data-test="tax-label"]').innerText(), await p.locator('[data-test="total-label"]').innerText());
await p.click('[data-test="cancel"]'); console.log('cancel step2 url', p.url(), 'badge', await p.locator('[data-test="shopping-cart-badge"]').innerText().catch(()=>'none'));
await p.goto('https://www.saucedemo.com/checkout-step-one.html'); await p.click('[data-test="cancel"]'); console.log('cancel step1 url', p.url());
await p.goto('https://www.saucedemo.com/checkout-step-one.html');
await p.fill('[data-test="firstName"]','Ana'); await p.fill('[data-test="lastName"]','Silva'); await p.fill('[data-test="postalCode"]','86000'); await p.click('[data-test="continue"]');
await p.click('[data-test="finish"]'); console.log('badge after finish', await p.locator('[data-test="shopping-cart-badge"]').count());
await p.goBack(); console.log('back after finish', p.url(), await p.locator('[data-test="total-label"]').innerText().catch(()=>'-'));
await p.click('[data-test="back-to-products"]').catch(()=>{});
await p.context().clearCookies(); await p.goto('https://www.saucedemo.com/checkout-step-two.html'); console.log('step2 logged out', await p.locator('[data-test="error"]').innerText().catch(()=>p.url()));
// enter key login
await p.goto('https://www.saucedemo.com/'); await p.fill('#user-name','standard_user'); await p.fill('#password','secret_sauce'); await p.press('#password','Enter'); await p.waitForTimeout(400); console.log('enter login', p.url());
// time to login per user
for (const u of ['standard_user','performance_glitch_user']) { await p.context().clearCookies(); await p.goto('https://www.saucedemo.com/'); await p.fill('#user-name',u); await p.fill('#password','secret_sauce'); const t=Date.now(); await p.click('#login-button'); await p.waitForSelector('[data-test="inventory-list"]'); console.log('login time', u, Date.now()-t, 'ms'); }
await b.close();
