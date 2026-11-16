// test-performance: boot time (3 runs), the game's own autoplay benchmark (3 runs, 90 s each), one run at 4x CPU throttle.
// Numbers come from this test machine (headless Edge), not from target phones.
import * as L from './lib.mjs';

const D = L.dirs('test-performance');
const results = [];
const log = [];
const check = (id, name, pass, expected, actual, evidence = []) => { const r = { id, name, pass, expected, actual, evidence }; results.push(r); L.saveResults(D.file('results.json'), [r]); console.log(pass ? 'PASS' : 'FAIL', id, name, '|', JSON.stringify(actual).slice(0, 400)); };
const browser = await L.launch();
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

// PF-01: boot to interactive main menu (loading screen gone), returning player, 3 runs
if (L.only('PF-01')) {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, 'PF-01');
    await L.seed(page, L.PLAYER());
    const t0 = Date.now();
    await page.goto(L.BASE);
    await page.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 30000 });
    runs.push(Date.now() - t0);
    await ctx.close();
  }
  L.writeJson(D.file('PF-01-boot.json'), { runs_ms: runs, median_ms: median(runs), note: 'The loading screen is shown for at least ~2.5 s by design (app.js runLoading).' });
  check('PF-01', 'Boot to the main menu (loading screen gone) within 4 s, median of 3', median(runs) <= 4000, '<= 4000 ms (design minimum ~2500 ms)', { runs_ms: runs, median_ms: median(runs) }, ['PF-01-boot.json']);
}

async function bench(tag, seconds, throttle = 1) {
  const ctx = await L.newContext(browser); const page = await ctx.newPage(); L.watch(page, log, tag);
  await L.seed(page, L.PLAYER());
  if (throttle > 1) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle }); }
  await page.goto(L.BASE + `#perfbench_${seconds}`);
  await page.waitForFunction(() => document.body.dataset.perf, null, { timeout: (seconds + 120) * 1000 });
  const report = JSON.parse(await page.evaluate(() => document.body.dataset.perf));
  await L.shot(page, D.file(`${tag}-end.jpg`));
  L.writeJson(D.file(`${tag}-report.json`), report);
  await ctx.close();
  return report;
}

const perMin = (r) => +(r.hitches / (r.seconds / 60)).toFixed(2);
// Budgets (60 Hz target): avg >= 55 fps, 1% low >= 45 fps, <= 2 hitches (>50 ms frames) per minute
if (L.only('PF-03')) {
  const reps = [];
  for (let i = 1; i <= 3; i++) reps.push(await bench(`PF-03-run${i}`, 60));
  const rows = reps.map((r) => ({ avg_fps: r.fps.avg, low1_fps: r.fps.low1, p95_ms: r.frameMs.p95, hitches_per_min: perMin(r), long_tasks: r.longTasks, renderer: r.scene.renderer }));
  L.writeJson(D.file('PF-03-summary.json'), rows);
  const failRuns = rows.filter((x) => x.avg_fps < 55 || x.low1_fps < 45 || x.hitches_per_min > 2).length;
  check('PF-03', 'Autoplay gameplay frame rate (3 x 60 s): avg >= 55 fps, 1% low >= 45 fps, <= 2 hitches/min', failRuns < 2,
    'budget met in at least 2 of 3 runs', { runs: rows, runs_over_budget: failRuns }, ['PF-03-summary.json', 'PF-03-run1-report.json', 'PF-03-run2-report.json', 'PF-03-run3-report.json']);
}
if (L.only('PF-05')) {
  const r = await bench('PF-05-throttle4x', 60, 4);
  const row = { avg_fps: r.fps.avg, low1_fps: r.fps.low1, p95_ms: r.frameMs.p95, hitches_per_min: perMin(r) };
  check('PF-05', 'Slow device (4x CPU throttle, 60 s): 1% low >= 30 fps', row.low1_fps >= 30, '1% low >= 30 fps', row, ['PF-05-throttle4x-report.json']);
}
if (L.only('PF-06')) {
  const r = await bench('PF-06-memory', 200);
  check('PF-06', 'Long session (200 s autoplay): JS heap grows <= 1 MB/min, DOM stable', r.memory.heapGrowthMBPerMin !== null && r.memory.heapGrowthMBPerMin <= 1 && !(r.memory.domGrowthPerMin > 20),
    '<= 1 MB/min, DOM growth <= 20 nodes/min', { memory: r.memory, verdict: r.verdict }, ['PF-06-memory-report.json']);
}

await browser.close();
L.writeJson(D.file('console.json'), log);
