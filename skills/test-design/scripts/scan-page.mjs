#!/usr/bin/env node
// Opens one or more pages, runs page-inventory.js on each, and saves the
// result plus a screenshot. Use it for public pages; for pages behind a login,
// pass a Playwright storage state file saved after logging in with a test account.
//
//   npm i playwright-core            (in the run folder, never in the product)
//   node scan-page.mjs <url> [<url>...] --out <run>/inventory [--state <storage-state.json>] [--width 1280] [--height 800]
//
// Drives the Edge already installed (BROWSER_CHANNEL=chrome for Chrome), so no browser download is needed.
// Writes <out>/<page>.json, <out>/<page>.jpg and <out>/inventory.md (fields and limits of every page).

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const optNames = new Set(['--out', '--state', '--width', '--height']);
const urls = argv.filter((a, i) => !a.startsWith('--') && !optNames.has(argv[i - 1]));
if (!urls.length) {
  console.log('Usage: node scan-page.mjs <url> [<url>...] --out <dir> [--state <storage-state.json>] [--width 1280] [--height 800]');
  process.exit(1);
}
const OUT = path.resolve(opt('--out', 'qa-reports/inventory'));
fs.mkdirSync(OUT, { recursive: true });

async function loadPlaywright() {
  if (process.env.PLAYWRIGHT_CORE) return import(process.env.PLAYWRIGHT_CORE);
  try {
    const req = createRequire(path.join(process.cwd(), 'noop.js'));
    return import(pathToFileURL(req.resolve('playwright-core')).href);
  } catch {
    try {
      return await import('playwright-core');
    } catch {
      console.error('playwright-core was not found. Run "npm i playwright-core" in the folder you run this from (the run folder, never the product).');
      process.exit(1);
    }
  }
}

const pw = await loadPlaywright();
const chromium = pw.chromium || pw.default?.chromium;
const SCRIPT = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'page-inventory.js'), 'utf8');
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
const context = await browser.newContext({
  viewport: { width: Number(opt('--width', 1280)), height: Number(opt('--height', 800)) },
  ...(opt('--state') ? { storageState: opt('--state') } : {}),
});
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push({ url: page.url(), text: m.text().slice(0, 300) }); });

const slug = (u) => {
  const x = new URL(u);
  return ((x.hostname + x.pathname).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'page').slice(0, 80);
};

const results = [];
for (const url of urls) {
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(800); // let late scripts render before reading the page
    const inv = await page.evaluate(SCRIPT);
    const name = slug(page.url());
    inv.consoleErrors = consoleErrors.filter((e) => e.url === page.url());
    fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(inv, null, 2));
    await page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 70, fullPage: true });
    results.push({ name, inv });
    console.log(`OK  ${url}  ->  ${name}.json`);
  } catch (e) {
    console.log(`ERR ${url}  ${e.message.split('\n')[0]}`);
    results.push({ name: slug(url), error: e.message.split('\n')[0], url });
  }
}
await browser.close();

// ---------- inventory.md ----------

const LIMITS = ['required', 'minlength', 'maxlength', 'min', 'max', 'step', 'pattern'];
let md = `# Page inventory\n\nScanned ${results.length} page(s). Raw data and full-page screenshots are next to this file.\n\n`;
for (const r of results) {
  if (r.error) { md += `## ${r.url}\n\nCould not scan: ${r.error}\n\n`; continue; }
  const inv = r.inv;
  md += `## ${inv.title || inv.url}\n\n${inv.url} · [data](${r.name}.json) · [screenshot](${r.name}.jpg)\n\n`;
  if (inv.headings.length) md += `Headings: ${inv.headings.join(' · ')}\n\n`;
  const fields = [...inv.forms.flatMap((f) => f.fields.map((x) => ({ ...x, form: f.index }))), ...inv.fieldsOutsideForms.map((x) => ({ ...x, form: '-' }))];
  if (fields.length) {
    md += `| Form | Field | Type | Label / placeholder | Test id | Limits |\n|---|---|---|---|---|---|\n`;
    for (const f of fields) {
      const limits = LIMITS.filter((k) => f[k] !== undefined).map((k) => (f[k] === true ? k : `${k}=${f[k]}`)).join(', ') || 'none in HTML';
      const opts = f.options ? ` (options: ${f.options.map((o) => o.text).join(' / ')})` : '';
      md += `| ${f.form} | ${f.name || f.id || f.tag} | ${f.type || f.tag} | ${(f.label || f.placeholder || f.note || '').replace(/\|/g, '/')}${opts} | ${f.testId || ''} | ${limits} |\n`;
    }
    md += '\n';
  }
  const buttons = [...inv.forms.flatMap((f) => f.buttons), ...inv.buttonsOutsideForms].filter((b) => b.visible);
  if (buttons.length) md += `Buttons: ${[...new Set(buttons.map((b) => b.text || b.testId))].join(' · ')}\n\n`;
  md += `Links on this site: ${inv.links.sameOrigin} · Images without alt: ${inv.images.withoutAlt} of ${inv.images.total} · Elements with test ids: ${inv.testIds}`;
  md += inv.consoleErrors.length ? ` · Console errors: ${inv.consoleErrors.length}\n\n` : '\n\n';
  if (inv.errorsShown.length) md += `Messages shown: ${inv.errorsShown.join(' · ')}\n\n`;
}
fs.writeFileSync(path.join(OUT, 'inventory.md'), md);
console.log(`\nWrote ${path.join(OUT, 'inventory.md')}`);
