// Exploration script for the test-design run on SauceDemo.
// Saves a logged-in browser state (state.json) for scan-page.mjs --state
// Run from examples/saucedemo-test-design with playwright-core installed: node scripts/login-state.mjs
import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage();
await p.goto('https://www.saucedemo.com/');
await p.fill('#user-name', 'standard_user'); await p.fill('#password', 'secret_sauce'); await p.click('#login-button');
await p.waitForURL(/inventory/);
await p.context().storageState({ path: 'state.json' });
await b.close(); console.log('state saved');
