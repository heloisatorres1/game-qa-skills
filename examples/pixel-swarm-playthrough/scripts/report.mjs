// Builds the playthrough report from inventory.json + evidence/.
//   node scripts/report.mjs             -> report.html (standalone page for the repo, links to full screenshots)
//   node scripts/report.mjs --artifact  -> <out> page body for publishing (no html/body wrapper, images inlined)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const RUN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifact = process.argv.includes('--artifact');
const outArg = process.argv[process.argv.indexOf('--out') + 1];
const OUT = process.argv.includes('--out') ? path.resolve(outArg) : path.join(RUN, 'completion-report.html');
const inv = JSON.parse(fs.readFileSync(path.join(RUN, 'inventory.json'), 'utf8'));
const rows = inv.rows;
const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- numbers ----------
const done = rows.filter((r) => r.status === 'completed');
const sum = (a) => a.reduce((x, y) => x + y, 0);
const fmt = (s) => { s = Math.round(s); const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60; return hh ? `${hh}h ${String(mm).padStart(2, '0')}m` : mm ? `${mm}m ${String(ss).padStart(2, '0')}s` : `${ss}s`; };
const playSeconds = sum(done.map((r) => r.seconds || 0));
const start = new Date(inv.setup.started), end = inv.finished ? new Date(inv.finished.at) : new Date();
const elapsed = (end - start) / 1000;
const attempts = sum(rows.map((r) => r.attempts || 0));
const threeStars = done.filter((r) => r.stars === 3).length;
const coinsGot = sum(done.map((r) => r.got || 0)), coinsExp = sum(done.map((r) => r.expected || 0));
const persAll = inv.persistence, pers = persAll.filter((p) => !p.harness), persHarness = persAll.filter((p) => p.harness);
const replayed = rows.filter((r) => r.replayed);
const issues = rows.filter((r) => r.notes && r.notes.replace(/tutorial level, played at 1x;? ?/, '').replace(/played again: [^;]*;? ?/, '').trim()).map((r) => `#${r.n} ${r.themeName} ${r.diff} ${r.level}: ${r.notes}`);
const group = (key) => {
  const m = new Map();
  for (const r of done) { const k = key(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r.seconds); }
  return [...m].map(([k, v]) => ({ k, n: v.length, total: sum(v), avg: sum(v) / v.length, min: Math.min(...v), max: Math.max(...v) }));
};
const byDiff = group((r) => (r.n === 1 ? 'Tutorial (1x)' : r.event ? `Event ${r.diff}` : r.diff[0].toUpperCase() + r.diff.slice(1)));
const byTheme = group((r) => r.themeName);

// ---------- images: thumbnails via the browser (downscaled JPEG data URLs) ----------
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
const page = await browser.newPage();
async function thumb(file, width) {
  const p = path.join(RUN, 'evidence', file);
  if (!fs.existsSync(p)) return null;
  const src = 'data:image/jpeg;base64,' + fs.readFileSync(p).toString('base64');
  return page.evaluate(async ([s, w]) => {
    const im = new Image(); im.src = s; await im.decode();
    const c = document.createElement('canvas'); c.width = w; c.height = Math.round(im.naturalHeight * (w / im.naturalWidth));
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.72);
  }, [src, width]);
}
const cardImg = {};
for (const r of rows) {
  const f = (r.evidence || []).find((e) => e.endsWith('-complete.jpg'));
  if (f) cardImg[r.n] = { thumb: await thumb(f, 180), full: f };
}
// bugs the playthrough found (from findings.json), with their screenshots
const findings = fs.existsSync(path.join(RUN, 'findings.json')) ? JSON.parse(fs.readFileSync(path.join(RUN, 'findings.json'), 'utf8')).findings.filter((f) => f.type === 'bug') : [];
for (const f of findings) {
  f.shots = [];
  for (const ev of f.evidence.filter((e) => e.type === 'screenshot')) f.shots.push({ t: await thumb(ev.path.replace(/^evidence\//, ''), 300), cap: ev.caption, path: ev.path });
}
const finals = [];
for (const [f, cap] of [['902-gallery.jpg', 'Collections: the gallery after the run'], ['901-levels.jpg', 'Levels screen at the end'], ['900-event-track.jpg', 'Halloween event: reward track after 12 wins']]) {
  const t = await thumb(f, 360); if (t) finals.push({ t, f, cap });
}
await browser.close();

// ---------- page ----------
const statusPill = done.length === rows.length ? `<span class="pill ok">All ${rows.length} levels completed</span>` : `<span class="pill warn">${done.length} of ${rows.length} levels completed</span>`;
const sections = [];
for (const [key, label] of [['flowers', 'Flowers'], ['fruits', 'Fruits'], ['animals', 'Animals'], ['sweets', 'Sweets'], ['ocean', 'Ocean'], ['halloween', 'Halloween event']]) {
  const rs = rows.filter((r) => r.theme === key);
  const secs = sum(rs.filter((r) => r.status === 'completed').map((r) => r.seconds || 0));
  sections.push(`<section class="theme">
    <header class="theme-head"><h3>${label}</h3><span class="meta">${rs.filter((r) => r.status === 'completed').length}/${rs.length} completed · ${fmt(secs)} of play</span></header>
    <div class="grid">${rs.map((r) => {
      const img = cardImg[r.n];
      const imgTag = img ? `<img src="${img.thumb}" alt="Level Complete screen, ${h(r.themeName)} ${h(r.diff)} ${r.event ? 'event ' : ''}level ${r.level}" loading="lazy" width="180">` : '<div class="noimg">no screenshot</div>';
      const linked = img && !artifact ? `<a href="evidence/${h(img.full)}">${imgTag}</a>` : imgTag;
      return `<figure class="lvl ${r.status !== 'completed' ? 'bad' : ''}">${linked}
        <figcaption><b>${r.event ? 'Event' : 'Level'} ${r.level}</b><span class="d ${r.diff}">${r.diff}</span>
        <span class="row"><span class="stars" aria-label="${r.stars} stars">${'★'.repeat(r.stars || 0)}<i>${'★'.repeat(3 - (r.stars || 0))}</i></span><span>${r.seconds ?? '-'} s</span><span>+${r.got ?? '-'}</span></span></figcaption></figure>`;
    }).join('')}</div></section>`);
}

const table = (title, data) => `<div class="tbl"><h3>${title}</h3><div class="scroll"><table><thead><tr><th>${title.includes('theme') ? 'Theme' : 'Difficulty'}</th><th>Levels</th><th>Play time</th><th>Average</th><th>Fastest</th><th>Slowest</th></tr></thead><tbody>
  ${data.map((d) => `<tr><td>${h(d.k)}</td><td>${d.n}</td><td>${fmt(d.total)}</td><td>${Math.round(d.avg)} s</td><td>${d.min} s</td><td>${d.max} s</td></tr>`).join('')}</tbody></table></div></div>`;

const body = `<title>Pixel Swarm Playthrough</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lilita+One&family=JetBrains+Mono:wght@500&display=swap">
<style>
/* Layout: a game-progress ledger. Summary tiles, then the time tables, then every level's real result screen as proof. */
:root{
  --bg:#f3f6ee; --surface:#ffffff; --ink:#1f2a1c; --muted:#5d6b57; --line:#d9e1d1;
  --leaf:#3f8a24; --honey:#e3a412; --wood:#6b3d17; --bad:#b42318;
  --display:"Lilita One","Trebuchet MS",system-ui,sans-serif; --text:Inter,system-ui,"Segoe UI",sans-serif; --mono:"JetBrains Mono",ui-monospace,Consolas,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141a12;--surface:#1c2419;--ink:#e8eee2;--muted:#a3b19b;--line:#2f3a2a;--leaf:#7cc95a;--honey:#f2bd45;--wood:#d39a5a;--bad:#ff8a80;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#141a12;--surface:#1c2419;--ink:#e8eee2;--muted:#a3b19b;--line:#2f3a2a;--leaf:#7cc95a;--honey:#f2bd45;--wood:#d39a5a;--bad:#ff8a80;color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font:15px/1.5 var(--text);margin:0}
.page{max-width:1120px;margin:0 auto;padding-block:28px 56px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:grid;gap:32px}
h1,h2,h3{font-family:var(--display);font-weight:400;letter-spacing:.01em;text-wrap:balance;margin:0}
h1{font-size:clamp(30px,5vw,44px);color:var(--wood)}
h2{font-size:24px}h3{font-size:19px}
.lead{max-width:68ch;color:var(--muted);margin:6px 0 0}
.top{display:grid;gap:10px}
.pill{display:inline-block;font:600 13px var(--text);padding:5px 12px;border-radius:999px;width:fit-content}
.pill.ok{background:color-mix(in srgb,var(--leaf) 16%,transparent);color:var(--leaf)}
.pill.warn{background:color-mix(in srgb,var(--honey) 22%,transparent);color:var(--wood)}
.kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}@media (max-width:640px){.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
.kpi{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px 16px;display:grid;gap:2px}
.kpi .v{font:500 clamp(19px,2.6vw,26px) var(--mono);white-space:nowrap;font-variant-numeric:tabular-nums;color:var(--ink)}
.kpi .l{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.kpi .s{font-size:13px;color:var(--muted)}
.kpi.hero{border-color:var(--leaf)} .kpi.hero .v{color:var(--leaf)}
.tables{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;max-width:760px}
.tbl{min-width:0;display:grid;gap:8px}.scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;background:var(--surface);border:1px solid var(--line);border-radius:10px;overflow:hidden;font-variant-numeric:tabular-nums}
th,td{padding:8px 12px;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap}
th{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:600}
tr:last-child td{border-bottom:0}
.theme{display:grid;gap:12px}
.theme-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 14px;border-bottom:2px solid var(--line);padding-bottom:6px}
.meta{color:var(--muted);font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:12px}
.lvl{margin:0;display:grid;gap:5px;min-width:0}
.lvl img{width:100%;height:auto;aspect-ratio:390/844;object-fit:cover;object-position:top;border-radius:8px;border:1px solid var(--line);display:block;background:var(--surface)}
.lvl.bad img{border:2px solid var(--bad)}
.lvl figcaption{display:grid;gap:2px;font-size:12.5px}
.lvl figcaption b{font-weight:600}
.d{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.d.hard{color:var(--wood)}.d.medium{color:var(--leaf)}
.row{display:flex;justify-content:space-between;gap:6px;font-variant-numeric:tabular-nums;color:var(--muted)}
.stars{color:var(--honey);letter-spacing:-1px}.stars i{font-style:normal;color:var(--line)}
.noimg{aspect-ratio:390/844;border:1px dashed var(--line);border-radius:8px;display:grid;place-items:center;color:var(--muted);font-size:12px}
.finals{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:16px}
.finals figure{margin:0;display:grid;gap:6px}.finals img{width:100%;border-radius:10px;border:1px solid var(--line)}
.finals figcaption{font-size:13px;color:var(--muted)}
.method{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:16px 20px;display:grid;gap:8px;max-width:80ch}
.method ul{margin:0;padding-left:20px;display:grid;gap:6px}
.facts{font:500 13px var(--mono);background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:12px;overflow-x:auto;white-space:pre}
a{color:var(--leaf)} a:focus-visible{outline:2px solid var(--honey);outline-offset:2px}
.foot{color:var(--muted);font-size:13px}
.bugs{display:grid;gap:12px}
.bug{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--bad);border-radius:10px;padding:16px 18px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:start}
.bug-text{display:grid;gap:6px;max-width:62ch;min-width:0}.bug-text p{margin:0}
.bug-id b{font-family:var(--mono);color:var(--bad)}
.sev{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--surface);background:var(--bad);border-radius:999px;padding:2px 8px}
.bug-shots{display:flex;gap:10px}.bug-shots figure{margin:0;width:150px;display:grid;gap:4px}.bug-shots img{width:100%;border-radius:8px;border:1px solid var(--line)}
.bug-shots figcaption{font-size:12px;color:var(--muted)}
@media (max-width:720px){.bug{grid-template-columns:1fr}.bug-shots figure{width:calc(50% - 5px)}}
</style>
<main class="page">
  <div class="top">
    <h1>Pixel Swarm: full playthrough</h1>
    ${statusPill}
    <p class="lead">Every level of Pixel Swarm v1.0.0 (5 themes × 3 difficulties × 6 levels, plus the 12 Halloween event levels) was played from a fresh install with real taps on the game's buttons. After each win the script checked the reward paid, the stars saved and which level opened next. Below each level is its own Level Complete screen, captured at the moment it was won.</p>
  </div>

  <div class="kpis">
    <div class="kpi hero"><span class="l">Levels completed</span><span class="v">${done.length}/${rows.length}</span><span class="s">${done.filter((r) => !r.event).length} theme + ${done.filter((r) => r.event).length} event levels · ${attempts === done.length ? 'all on the first try' : `${attempts - done.length} retries`}</span></div>
    <div class="kpi"><span class="l">Time to complete</span><span class="v">${fmt(elapsed)}</span><span class="s">first launch to last level, incl. menus and ads</span></div>
    <div class="kpi"><span class="l">Time playing levels</span><span class="v">${fmt(playSeconds)}</span><span class="s">level start to win, summed</span></div>
    <div class="kpi"><span class="l">3-star wins</span><span class="v">${threeStars}/${done.length}</span><span class="s">stars saved match the popup</span></div>
    <div class="kpi"><span class="l">Coins from wins</span><span class="v">${coinsGot.toLocaleString('en-US')}</span><span class="s">${coinsGot === coinsExp ? 'exactly the rule (30 / 45 / 60 per win)' : `expected ${coinsExp.toLocaleString('en-US')}`}</span></div>
    <div class="kpi"><span class="l">Persistence checks</span><span class="v">${pers.filter((p) => p.pass).length}/${pers.length}</span><span class="s">progress kept after a reload, every section</span></div>
  </div>

  ${findings.length ? `<section class="bugs">
    <h2>${findings.length === 1 ? 'Bug found on the way' : `${findings.length} bugs found on the way`}</h2>
    ${findings.map((f) => `<article class="bug">
      <div class="bug-text"><p class="bug-id"><b>${h(f.id)}</b> <span class="sev">${h(f.severity)}</span> <span class="meta">reproduced ${h(f.repro_rate)}</span></p>
        <h3>${h(f.title)}</h3>
        <p><b>Expected:</b> ${h(f.expected)}</p><p><b>Actual:</b> ${h(f.actual)}</p>
        <p class="meta"><b>Fix:</b> ${h(f.suggested_fix || '')}</p>
        ${artifact ? '' : `<p class="meta">Video and data: <a href="report.html#${h(f.id)}">bug report</a></p>`}</div>
      <div class="bug-shots">${f.shots.filter((s) => s.t).map((s) => `<figure><img src="${s.t}" alt="${h(s.cap)}"><figcaption>${h(s.cap)}</figcaption></figure>`).join('')}</div>
    </article>`).join('')}
  </section>` : ''}

  <section style="display:grid;gap:14px">
    <h2>Time</h2>
    <p class="lead" style="margin:0">Started ${h(start.toISOString().replace('T', ' ').slice(0, 16))} UTC, finished ${h(end.toISOString().replace('T', ' ').slice(0, 16))} UTC. Levels ran at the game's 8x speed (bought in its Speed Store) except the tutorial level, which a new player plays at normal speed.</p>
    <div class="tables">${table('By difficulty', byDiff)}${table('By theme', byTheme)}</div>
  </section>

  <section style="display:grid;gap:22px">
    <h2>Proof, level by level</h2>
    ${sections.join('\n')}
  </section>

  ${finals.length ? `<section style="display:grid;gap:14px"><h2>End state</h2><div class="finals">${finals.map((x) => `<figure>${artifact ? `<img src="${x.t}" alt="${h(x.cap)}">` : `<a href="evidence/${h(x.f)}"><img src="${x.t}" alt="${h(x.cap)}"></a>`}<figcaption>${h(x.cap)}</figcaption></figure>`).join('')}</div>
  ${inv.finished ? `<div class="facts">${h(JSON.stringify({ gallery_pictures: inv.finished.gallery, gallery_screen: inv.finished.gallery_screen_text, levels_in_save: inv.finished.levels_in_save, event_levels: inv.finished.event_levels, pumpkins: inv.finished.pumpkins, event_rewards_claimed: inv.finished.event_rewards_claimed, levels_won_stat: inv.finished.stats && inv.finished.stats.levels, player_level: inv.finished.playerLevel, page_errors: inv.finished.page_errors }, null, 2))}</div>` : ''}</section>` : ''}

  <section class="method">
    <h2>How it was played</h2>
    <ul>
      <li>Fresh browser profile: age gate, story and welcome screen, then the tutorial level with all 6 tutorial steps.</li>
      <li>Every move is a real click on a block in the game. The order follows the solution order of the game's own solver (columns in rotation, one block at a time), read from what is on screen. The auto-solve, level skip and win cheats were never used.</li>
      <li>Logged economy aid: 500 gems from the debug menu, spent in the Speed Store on the permanent 8x speed. At the start of every level the player taps the speed button up to 8x.</li>
      <li>After each win: the reward shown, the coins actually paid, the stars saved and the next level were checked. After each 6-level section the page was reloaded to confirm the progress was saved.</li>
      ${replayed.length ? `<li>When the test run was stopped and moved to a durable folder, the browser was closed about a second after a win, before that win reached the disk. The game then correctly kept the next level locked. The script compares the save with the inventory on every start, so the lost win (${replayed.map((r) => '#' + r.n).join(', ')}) was played again and the section continued. This was a test-harness interruption, not a game bug${persHarness.length ? '; the persistence check taken during it (' + persHarness.map((p) => p.after + ': ' + p.actual).join(', ') + ') is not counted above' : ''}.</li>` : ''}
      <li>The Level Complete screenshots of levels 1-50 were taken while the popup was still fading in, so they look faint; from level 51 on the script waits for the popup to finish. The save data in the inventory confirms every win either way.</li>
      <li>${issues.length ? `Checks that did not match: ${issues.map(h).join(' · ')}` : 'No reward, star or unlock mismatch was found during the run.'}</li>
    </ul>
  </section>
  <p class="foot">Recorded with the full-playthrough skill (game-qa-skills). ${artifact ? '' : 'Row-by-row data: <a href="inventory.md">inventory.md</a> · event log: <a href="playthrough-log.md">playthrough-log.md</a> · script: <a href="scripts/playthrough.mjs">scripts/playthrough.mjs</a>'}</p>
</main>`;

const out = artifact ? body : `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${body.replace('</main>', '</main>')}`.replace('<main', '</head><body><main') + '</body></html>';
fs.writeFileSync(OUT, out);
console.log(`wrote ${OUT} (${Math.round(out.length / 1024)} KB): ${done.length}/${rows.length} levels, elapsed ${fmt(elapsed)}, play ${fmt(playSeconds)}`);
