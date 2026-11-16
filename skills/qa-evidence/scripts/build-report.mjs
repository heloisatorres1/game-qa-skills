#!/usr/bin/env node
// Builds report.md and report.html from one or more findings.json files.
// Zero dependencies. Node 18+.
//
//   node build-report.mjs <findings.json> [more.json ...] [--out <dir>] [--embed] [--allow-warnings]
//
// With several inputs the findings are merged into one report (IDs are
// prefixed with the source skill when they collide, evidence paths are
// rewritten relative to the output folder).

import fs from 'node:fs';
import path from 'node:path';

const SEVERITIES = ['blocker', 'critical', 'major', 'minor', 'trivial'];
const TYPES = ['bug', 'text', 'query', 'observation'];
const STATUSES = ['PASS', 'FAIL', 'PARTIAL', 'BLOCKED', 'NOT_TESTED'];
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const VIDEO_EXT = new Set(['.mp4', '.webm']);

function parseArgs(argv) {
  const args = { inputs: [], out: null, embed: false, allowWarnings: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.out = argv[++i];
    else if (a === '--embed') args.embed = true;
    else if (a === '--allow-warnings') args.allowWarnings = true;
    else if (a === '-h' || a === '--help') args.help = true;
    else args.inputs.push(a);
  }
  return args;
}

function readRun(file) {
  const abs = path.resolve(file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    throw new Error(`${file}: cannot read JSON (${e.message})`);
  }
  return { file: abs, dir: path.dirname(abs), data };
}

// ---------- validation ----------

const VISUAL_TYPES = new Set(['screenshot', 'video', 'frames']);
const isVisual = (ev) => VISUAL_TYPES.has(ev.type) || (ev.path && (IMAGE_EXT.has(path.extname(ev.path).toLowerCase()) || VIDEO_EXT.has(path.extname(ev.path).toLowerCase())));

// allIds: finding ids of every input file (coverage rows may link to a finding filed by another module)
function validate(run, allIds = new Set()) {
  const errors = [];
  const warnings = [];
  const where = path.basename(run.dir) + '/findings.json';
  const d = run.data;
  if (!d.run || typeof d.run !== 'object') errors.push(`${where}: missing "run" object`);
  else {
    for (const f of ['skill', 'game', 'build', 'platform', 'access_mode', 'date', 'scope', 'summary']) {
      if (!d.run[f]) errors.push(`${where}: run.${f} is required`);
    }
  }
  if (!Array.isArray(d.findings)) errors.push(`${where}: "findings" must be an array (can be empty)`);
  if (!Array.isArray(d.coverage) || d.coverage.length === 0) errors.push(`${where}: "coverage" must list at least one area`);

  const ids = new Set();
  for (const [i, f] of (d.findings || []).entries()) {
    const tag = `${where}: finding ${f.id || '#' + (i + 1)}`;
    if (!f.id) errors.push(`${tag}: id is required`);
    else if (ids.has(f.id)) errors.push(`${tag}: duplicate id`);
    ids.add(f.id);
    if (!f.title) errors.push(`${tag}: title is required`);
    if (!TYPES.includes(f.type)) errors.push(`${tag}: type must be one of ${TYPES.join(', ')}`);
    if (['bug', 'text'].includes(f.type) && !SEVERITIES.includes(f.severity)) errors.push(`${tag}: severity must be one of ${SEVERITIES.join(', ')}`);
    if (!f.area) errors.push(`${tag}: area is required`);
    if (!['confirmed', 'unconfirmed'].includes(f.status)) errors.push(`${tag}: status must be confirmed or unconfirmed`);
    if (f.type === 'bug') {
      if (!Array.isArray(f.steps) || f.steps.length === 0) errors.push(`${tag}: a bug needs reproduction steps`);
      if (!f.repro_rate) errors.push(`${tag}: a bug needs repro_rate ("2/2", or "static" for file-based)`);
      if (f.status === 'confirmed' && f.repro_rate && f.repro_rate !== 'static') {
        const m = /^(\d+)\s*\/\s*(\d+)$/.exec(f.repro_rate);
        if (m && Number(m[1]) < 2) errors.push(`${tag}: "confirmed" needs at least 2 reproductions (got ${f.repro_rate}); mark it unconfirmed/observation instead`);
      }
      // a runtime bug must be visible: screenshot, video or frames (or say why it cannot be)
      if (f.repro_rate && f.repro_rate !== 'static' && !(f.evidence || []).some(isVisual) && !f.no_visual_reason) {
        errors.push(`${tag}: a runtime bug needs a screenshot, video or frames (or "no_visual_reason")`);
      }
    }
    if (['bug', 'text'].includes(f.type) && (!f.expected || !f.actual)) errors.push(`${tag}: expected and actual are required`);
    if (!Array.isArray(f.evidence) || f.evidence.length === 0) errors.push(`${tag}: at least one piece of evidence is required`);
    for (const ev of f.evidence || []) checkEvidence(ev, run.dir, tag, errors);
  }

  for (const c of d.coverage || []) {
    const tag = `${where}: coverage "${c.area || '?'}"`;
    if (!c.area) errors.push(`${tag}: area is required`);
    if (!STATUSES.includes(c.status)) errors.push(`${tag}: status must be one of ${STATUSES.join(', ')}`);
    if (['PARTIAL', 'BLOCKED', 'NOT_TESTED'].includes(c.status) && !c.notes) errors.push(`${tag}: ${c.status} needs a reason in notes`);
    if (c.status === 'FAIL' && (!Array.isArray(c.findings) || c.findings.length === 0)) errors.push(`${tag}: FAIL must link finding IDs`);
    for (const id of c.findings || []) if (!ids.has(id) && !allIds.has(id)) warnings.push(`${tag}: links unknown finding ${id}`);
    if (c.status === 'PASS' && !(c.evidence && c.evidence.length)) warnings.push(`${tag}: PASS without evidence (add a screenshot or log that shows it working)`);
    for (const ev of c.evidence || []) checkEvidence(typeof ev === 'string' ? { path: ev } : ev, run.dir, tag, errors);
  }
  return { errors, warnings };
}

function checkEvidence(ev, dir, tag, errors) {
  if (!ev || (!ev.path && !ev.ref)) {
    errors.push(`${tag}: evidence item needs "path" (file) or "ref" (file:line)`);
    return;
  }
  if (ev.path && !/^https?:/.test(ev.path) && !fs.existsSync(path.resolve(dir, ev.path))) {
    errors.push(`${tag}: evidence file not found: ${ev.path}`);
  }
}

// ---------- merge ----------

function merge(runs, outDir) {
  if (runs.length === 1) {
    const r = runs[0];
    return { ...r.data, findings: (r.data.findings || []).map(f => rebase(f, r, outDir)), coverage: (r.data.coverage || []).map(c => rebaseCoverage(c, r, outDir)) };
  }
  const seen = new Set();
  const findings = [];
  const coverage = [];
  for (const r of runs) {
    const skill = r.data.run.skill;
    const rename = {};
    for (const f of r.data.findings || []) {
      let id = f.id;
      if (seen.has(id)) id = `${skill}-${f.id}`;
      seen.add(id);
      rename[f.id] = id;
      findings.push({ ...rebase(f, r, outDir), id, source_run: skill });
    }
    for (const c of r.data.coverage || []) {
      coverage.push({ ...rebaseCoverage(c, r, outDir), area: `${skill} / ${c.area}`, findings: (c.findings || []).map(x => rename[x] || x) });
    }
  }
  const first = runs[0].data.run;
  return {
    run: {
      skill: 'test-game-full',
      game: first.game,
      build: unique(runs.map(r => r.data.run.build)).join(' | '),
      platform: unique(runs.map(r => r.data.run.platform)).join(' | '),
      access_mode: unique(runs.map(r => r.data.run.access_mode)).join(' | '),
      date: runs.map(r => r.data.run.date).sort().at(-1),
      tester: first.tester,
      scope: runs.map(r => r.data.run.skill).join(', '),
      summary: runs.map(r => `${r.data.run.skill}: ${r.data.run.summary}`).join(' '),
    },
    coverage,
    findings,
  };
}

function unique(list) { return [...new Set(list.filter(Boolean))]; }

function rebasePath(p, r, outDir) {
  if (!p || /^https?:/.test(p)) return p;
  return path.relative(outDir, path.resolve(r.dir, p)).split(path.sep).join('/');
}

function rebase(f, r, outDir) {
  return { ...f, evidence: (f.evidence || []).map(ev => ({ ...ev, path: rebasePath(ev.path, r, outDir) })) };
}

function rebaseCoverage(c, r, outDir) {
  return { ...c, evidence: (c.evidence || []).map(ev => typeof ev === 'string' ? { path: rebasePath(ev, r, outDir) } : { ...ev, path: rebasePath(ev.path, r, outDir) }) };
}

// ---------- verdict & sorting ----------

function computeVerdict(report) {
  if (report.run.verdict) return report.run.verdict;
  const confirmed = report.findings.filter(f => f.status === 'confirmed' && ['bug', 'text'].includes(f.type));
  if (confirmed.some(f => f.severity === 'blocker')) return 'blocked';
  if (confirmed.some(f => ['critical', 'major'].includes(f.severity))) return 'fail';
  if (report.coverage.some(c => c.status === 'BLOCKED')) return 'blocked';
  if (confirmed.length || report.findings.length) return 'pass_with_issues';
  return 'pass';
}

const VERDICT_LABEL = { pass: 'PASS', pass_with_issues: 'PASS WITH ISSUES', fail: 'FAIL', blocked: 'BLOCKED' };

function sortFindings(list) {
  const typeRank = { bug: 0, text: 1, observation: 2, query: 3 };
  return [...list].sort((a, b) =>
    (a.status === 'confirmed' ? 0 : 1) - (b.status === 'confirmed' ? 0 : 1) ||
    (typeRank[a.type] ?? 9) - (typeRank[b.type] ?? 9) ||
    sevRank(a) - sevRank(b) ||
    String(a.id).localeCompare(String(b.id)));
}
function sevRank(f) { const i = SEVERITIES.indexOf(f.severity); return i < 0 ? 9 : i; }

function counts(findings) {
  const c = Object.fromEntries(SEVERITIES.map(s => [s, 0]));
  for (const f of findings) if (f.status === 'confirmed' && c[f.severity] !== undefined && ['bug', 'text'].includes(f.type)) c[f.severity]++;
  return c;
}

// ---------- markdown ----------

function md(report) {
  const r = report.run;
  const c = counts(report.findings);
  const out = [];
  out.push(`# QA Report: ${r.game}`, '');
  out.push(`**Verdict: ${VERDICT_LABEL[report.verdict]}**`, '', r.summary, '');
  out.push('| | |', '|---|---|');
  for (const [k, label] of [['skill', 'Skill'], ['build', 'Build'], ['platform', 'Platform'], ['access_mode', 'Access'], ['date', 'Date'], ['tester', 'Tester'], ['scope', 'Scope']]) {
    out.push(`| ${label} | ${esc(r[k] || (k === 'tester' ? 'Claude (AI-assisted QA)' : ''))} |`);
  }
  out.push('', `**Confirmed:** ${SEVERITIES.map(s => `${c[s]} ${s}`).join(' · ')}`, '');
  out.push('## Coverage', '', '| Area | Status | Checks | Findings | Notes |', '|---|---|---|---|---|');
  for (const cv of report.coverage) {
    const checks = cv.checks_total != null ? `${cv.checks_passed ?? '?'}/${cv.checks_total}` : '';
    out.push(`| ${esc(cv.area)} | ${cv.status} | ${checks} | ${(cv.findings || []).join(', ')} | ${esc(cv.notes || '')} |`);
  }
  out.push('', '## Findings', '');
  if (!report.findings.length) out.push('No findings.', '');
  out.push('| ID | Severity | Type | Status | Title |', '|---|---|---|---|---|');
  for (const f of report.findings) out.push(`| ${f.id} | ${f.severity || '-'} | ${f.type} | ${f.status} | ${esc(f.title)} |`);
  out.push('');
  for (const f of report.findings) {
    out.push(`### ${f.id}: ${f.title}`, '');
    out.push(`**Severity:** ${f.severity || '-'} · **Type:** ${f.type} · **Area:** ${f.area} · **Status:** ${f.status}${f.repro_rate ? ` · **Repro:** ${f.repro_rate}` : ''}`, '');
    if (f.environment) out.push(`**Environment:** ${f.environment}`, '');
    if (f.preconditions) out.push(`**Preconditions:** ${f.preconditions}`, '');
    if (f.steps?.length) { out.push('**Steps**', ''); f.steps.forEach((s, i) => out.push(`${i + 1}. ${s}`)); out.push(''); }
    if (f.expected) out.push(`**Expected:** ${f.expected}`, '');
    if (f.actual) out.push(`**Actual:** ${f.actual}`, '');
    out.push('**Evidence**', '');
    for (const ev of f.evidence || []) {
      const target = ev.path || ev.ref;
      const isImg = ev.path && IMAGE_EXT.has(path.extname(ev.path).toLowerCase());
      out.push(isImg ? `- ${esc(ev.caption || '')}\n\n  ![${esc(ev.caption || f.id)}](${ev.path})` : `- \`${target}\`${ev.caption ? `: ${ev.caption}` : ''}`);
    }
    out.push('');
    if (f.suspected_cause) out.push(`**Suspected cause (hypothesis):** ${f.suspected_cause}`, '');
    if (f.suggested_fix) out.push(`**Suggested fix:** ${f.suggested_fix}`, '');
    if (f.related?.length) out.push(`**Related:** ${f.related.join(', ')}`, '');
  }
  return out.join('\n');
}

function esc(s) { return String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' '); }

// ---------- html ----------

function h(s) { return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

function mediaSrc(p, outDir, embed) {
  if (!embed || /^https?:/.test(p)) return p;
  const abs = path.resolve(outDir, p);
  const ext = path.extname(abs).slice(1).toLowerCase().replace('jpg', 'jpeg');
  const mime = VIDEO_EXT.has('.' + ext) ? `video/${ext}` : `image/${ext}`;
  return `data:${mime};base64,${fs.readFileSync(abs).toString('base64')}`;
}

function evidenceHtml(ev, outDir, embed) {
  const cap = ev.caption ? `<figcaption>${h(ev.caption)}</figcaption>` : '';
  if (!ev.path) return `<figure class="ref"><code>${h(ev.ref)}</code>${cap}</figure>`;
  const ext = path.extname(ev.path).toLowerCase();
  if (IMAGE_EXT.has(ext)) return `<figure><a href="${h(ev.path)}"><img src="${h(mediaSrc(ev.path, outDir, embed))}" alt="${h(ev.caption || ev.path)}" loading="lazy"></a>${cap}</figure>`;
  if (VIDEO_EXT.has(ext)) return `<figure><video controls src="${h(mediaSrc(ev.path, outDir, embed))}"></video>${cap}</figure>`;
  const abs = path.resolve(outDir, ev.path);
  if (/^https?:/.test(ev.path) || !fs.existsSync(abs)) return `<figure class="ref"><a href="${h(ev.path)}">${h(ev.path)}</a>${cap}</figure>`;
  if (fs.statSync(abs).isDirectory()) { // frame sequence: show the images in order
    const imgs = fs.readdirSync(abs).filter((n) => IMAGE_EXT.has(path.extname(n).toLowerCase())).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    return `<figure class="frames"><div class="strip">${imgs.map((n) => { const p = `${ev.path.replace(/\/$/, '')}/${n}`; return `<img src="${h(mediaSrc(p, outDir, embed))}" alt="${h(n)}" loading="lazy">`; }).join('')}</div>${cap}</figure>`;
  }
  const size = fs.statSync(abs).size;
  if (size <= 20000) {
    return `<figure class="log"><div class="logname"><a href="${h(ev.path)}">${h(ev.path)}</a></div><pre>${h(fs.readFileSync(abs, 'utf8'))}</pre>${cap}</figure>`;
  }
  return `<figure class="ref"><a href="${h(ev.path)}">${h(ev.path)}</a> (${Math.round(size / 1024)} KB)${cap}</figure>`;
}

function html(report, outDir, embed) {
  const r = report.run;
  const c = counts(report.findings);
  const meta = [['Skill', r.skill], ['Build', r.build], ['Platform', r.platform], ['Access', r.access_mode], ['Date', r.date], ['Tester', r.tester || 'Claude (AI-assisted QA)'], ['Scope', r.scope]];
  const cards = report.findings.map(f => `
<article class="finding" id="${h(f.id)}">
  <header>
    <span class="id">${h(f.id)}</span>
    ${f.severity ? `<span class="sev sev-${h(f.severity)}">${h(f.severity)}</span>` : ''}
    <span class="tag">${h(f.type)}</span>
    <span class="tag ${f.status === 'confirmed' ? 'ok' : 'warn'}">${h(f.status)}${f.repro_rate ? ' · ' + h(f.repro_rate) : ''}</span>
    <span class="tag">${h(f.area)}</span>
  </header>
  <h3>${h(f.title)}</h3>
  ${f.environment ? `<p class="small"><b>Environment:</b> ${h(f.environment)}</p>` : ''}
  ${f.preconditions ? `<p><b>Preconditions:</b> ${h(f.preconditions)}</p>` : ''}
  ${f.steps?.length ? `<b>Steps</b><ol>${f.steps.map(s => `<li>${h(s)}</li>`).join('')}</ol>` : ''}
  <div class="ea">
    ${f.expected ? `<div><b>Expected</b><p>${h(f.expected)}</p></div>` : ''}
    ${f.actual ? `<div><b>Actual</b><p>${h(f.actual)}</p></div>` : ''}
  </div>
  <b>Evidence</b>
  <div class="evidence">${(f.evidence || []).map(ev => evidenceHtml(ev, outDir, embed)).join('')}</div>
  ${f.suspected_cause ? `<p class="small"><b>Suspected cause (hypothesis):</b> ${h(f.suspected_cause)}</p>` : ''}
  ${f.suggested_fix ? `<p class="small"><b>Suggested fix:</b> ${h(f.suggested_fix)}</p>` : ''}
  ${f.related?.length ? `<p class="small"><b>Related:</b> ${f.related.map(x => `<a href="#${h(x)}">${h(x)}</a>`).join(', ')}</p>` : ''}
</article>`).join('\n');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>QA Report: ${h(r.game)}</title>
<style>
:root{--bg:#f7f7f5;--card:#fff;--fg:#1d1d1f;--muted:#6b6b70;--line:#e3e3e0;--ok:#1f7a3f;--warn:#9a6700;--bad:#b42318;--blk:#7a0d0d;--accent:#3b5bdb}
@media (prefers-color-scheme:dark){:root{--bg:#141416;--card:#1d1d20;--fg:#ececef;--muted:#9a9aa2;--line:#2e2e33;--ok:#5cc98a;--warn:#e3b341;--bad:#ff7b72;--blk:#ff9b9b;--accent:#8ea2ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:1000px;margin:0 auto;padding:24px 16px 64px}h1{margin:0 0 4px;font-size:26px}h2{margin:36px 0 12px;font-size:19px}h3{margin:6px 0 10px;font-size:17px}
.verdict{display:inline-block;padding:4px 12px;border-radius:6px;font-weight:700;letter-spacing:.03em;margin:8px 0}
.v-pass{background:color-mix(in srgb,var(--ok) 18%,transparent);color:var(--ok)}.v-pass_with_issues{background:color-mix(in srgb,var(--warn) 18%,transparent);color:var(--warn)}
.v-fail{background:color-mix(in srgb,var(--bad) 18%,transparent);color:var(--bad)}.v-blocked{background:color-mix(in srgb,var(--blk) 22%,transparent);color:var(--blk)}
.meta{display:grid;grid-template-columns:max-content 1fr;gap:4px 16px;margin:12px 0;color:var(--muted)}.meta b{color:var(--fg);font-weight:600}
.tiles{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.tile{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px 14px;min-width:92px}.tile .n{font-size:22px;font-weight:700}.tile .l{font-size:12px;color:var(--muted);text-transform:uppercase}
.table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;background:var(--card);border:1px solid var(--line);border-radius:8px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:12px;text-transform:uppercase;color:var(--muted)}
.st{font-weight:700;font-size:12px}.st-PASS{color:var(--ok)}.st-FAIL{color:var(--bad)}.st-PARTIAL,.st-NOT_TESTED{color:var(--warn)}.st-BLOCKED{color:var(--blk)}
.finding{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin:14px 0}.finding header{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.id{font-weight:700;font-family:ui-monospace,Consolas,monospace}.tag,.sev{font-size:12px;padding:2px 8px;border-radius:999px;border:1px solid var(--line);color:var(--muted)}
.tag.ok{color:var(--ok)}.tag.warn{color:var(--warn)}.sev{color:#fff;border:0;font-weight:600}.sev-blocker{background:var(--blk)}.sev-critical{background:var(--bad)}.sev-major{background:#c2410c}.sev-minor{background:#a16207}.sev-trivial{background:#6b7280}
.ea{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ea p{margin:4px 0 12px}@media (max-width:640px){.ea{grid-template-columns:1fr}}
.evidence{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin:8px 0 12px}figure{margin:0}figure img,figure video{width:100%;border:1px solid var(--line);border-radius:6px;display:block}
figcaption{font-size:13px;color:var(--muted);margin-top:4px}figure.log,figure.ref,figure.frames{grid-column:1/-1}
.strip{display:flex;gap:6px;overflow-x:auto}.strip img{width:140px;flex:none}pre{background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:10px;overflow:auto;max-height:280px;font-size:12px;margin:4px 0}
.logname{font-size:12px}.small{font-size:14px;color:var(--muted)}.small b{color:var(--fg)}a{color:var(--accent)}code{font-family:ui-monospace,Consolas,monospace}
</style></head><body><main>
<h1>QA Report: ${h(r.game)}</h1>
<div class="verdict v-${h(report.verdict)}">${VERDICT_LABEL[report.verdict]}</div>
<p>${h(r.summary)}</p>
<div class="meta">${meta.map(([k, v]) => `<b>${k}</b><span>${h(v)}</span>`).join('')}</div>
<div class="tiles">${SEVERITIES.map(s => `<div class="tile"><div class="n">${c[s]}</div><div class="l">${s}</div></div>`).join('')}
<div class="tile"><div class="n">${report.findings.filter(f => f.status !== 'confirmed' || ['query', 'observation'].includes(f.type)).length}</div><div class="l">queries / unconfirmed</div></div></div>
<h2>Coverage</h2>
<div class="table-wrap"><table><thead><tr><th>Area</th><th>Status</th><th>Checks</th><th>Findings</th><th>Notes</th></tr></thead><tbody>
${report.coverage.map(cv => `<tr><td>${h(cv.area)}</td><td class="st st-${h(cv.status)}">${h(cv.status)}</td><td>${cv.checks_total != null ? `${h(cv.checks_passed ?? '?')}/${h(cv.checks_total)}` : ''}</td><td>${(cv.findings || []).map(x => `<a href="#${h(x)}">${h(x)}</a>`).join(', ')}</td><td>${h(cv.notes || '')}</td></tr>`).join('\n')}
</tbody></table></div>
<h2>Findings (${report.findings.length})</h2>
${report.findings.length ? `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Severity</th><th>Type</th><th>Status</th><th>Title</th></tr></thead><tbody>
${report.findings.map(f => `<tr><td><a href="#${h(f.id)}">${h(f.id)}</a></td><td>${h(f.severity || '-')}</td><td>${h(f.type)}</td><td>${h(f.status)}</td><td>${h(f.title)}</td></tr>`).join('\n')}
</tbody></table></div>` : '<p>No findings.</p>'}
${cards}
</main></body></html>`;
}

// ---------- main ----------

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.inputs.length === 0) {
    console.log('Usage: node build-report.mjs <findings.json> [more.json ...] [--out <dir>] [--embed] [--allow-warnings]');
    process.exit(args.help ? 0 : 1);
  }
  const runs = args.inputs.map(readRun);
  let errors = [];
  let warnings = [];
  const allIds = new Set(runs.flatMap((r) => (r.data.findings || []).map((f) => f.id)));
  for (const r of runs) {
    const v = validate(r, allIds);
    errors = errors.concat(v.errors);
    warnings = warnings.concat(v.warnings);
  }
  for (const w of warnings) console.warn('warning: ' + w);
  if (errors.length) {
    console.error(`\n${errors.length} problem(s) found. Fix findings.json and run again:\n`);
    for (const e of errors) console.error('  - ' + e);
    process.exit(2);
  }
  if (warnings.length && !args.allowWarnings) {
    console.warn(`\n${warnings.length} warning(s). The report is built, but review them (use --allow-warnings to silence this note).`);
  }
  const outDir = path.resolve(args.out || runs[0].dir);
  fs.mkdirSync(outDir, { recursive: true });
  const merged = merge(runs, outDir);
  const report = { ...merged, findings: sortFindings(merged.findings) };
  report.verdict = computeVerdict(report);
  if (runs.length > 1) fs.writeFileSync(path.join(outDir, 'findings.json'), JSON.stringify(merged, null, 2));
  fs.writeFileSync(path.join(outDir, 'report.md'), md(report));
  fs.writeFileSync(path.join(outDir, 'report.html'), html(report, outDir, args.embed));
  const c = counts(report.findings);
  console.log(`Verdict: ${VERDICT_LABEL[report.verdict]}  |  ${SEVERITIES.map(s => `${s}: ${c[s]}`).join('  ')}`);
  console.log(`Wrote ${path.join(outDir, 'report.html')}`);
  console.log(`Wrote ${path.join(outDir, 'report.md')}`);
}

try {
  main();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
