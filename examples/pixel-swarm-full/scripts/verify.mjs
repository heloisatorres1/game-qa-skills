// test-puzzles, PZ-03: solvability of every level with the game's own verifier (#verify_all). Slow: it simulates all levels.
import fs from 'node:fs';
import * as L from './lib.mjs';

const D = L.dirs('test-puzzles');
const log = [];
const browser = await L.launch();
// PZ-03: solvability of all levels with the game's own verifier (#verify_all)
{
  const t0 = Date.now();
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'PZ-03');
  await L.seed(page, L.PLAYER()); await L.openGame(page, 'verify_all', 1000);
  await page.locator('#verify-report').waitFor({ timeout: 900000 });
  const text = await page.locator('#verify-report').textContent();
  fs.writeFileSync(D.file('PZ-03-verify-all.txt'), text);
  const m = /LEVEL CHECK: (\d+)\/(\d+)/.exec(text) || [];
  const unsolvable = /unsolvable!/.test(text);
  const r = { id: 'PZ-03', name: 'Every level (all themes, difficulties, event) can be completed by the solution check', pass: !!(m[1] && m[1] === m[2] && !unsolvable), expected: 'N/N levels, no unsolvable forced-puzzle variants', actual: { result: m[0], unsolvable_variants: unsolvable, seconds: Math.round((Date.now() - t0) / 1000) }, evidence: ['PZ-03-verify-all.txt'], assisted: true };
  console.log(r.pass ? 'PASS' : 'FAIL', r.id, JSON.stringify(r.actual));
  L.writeJson(D.file('results-verify.json'), [r]);
  await ctx.close();
}


await browser.close();
