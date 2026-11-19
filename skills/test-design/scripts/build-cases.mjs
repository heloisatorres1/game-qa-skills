#!/usr/bin/env node
// Checks a test-cases.json and turns it into readable files.
// It refuses cases a reviewer could not run or trust: no source, no steps,
// a vague expected result, a missing priority reason, a duplicate ID.
//
//   node build-cases.mjs <run>/test-cases.json [--out <dir>]
//
// Writes test-cases.md, test-cases.csv, coverage.md and questions.md next to the JSON (or in --out).

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith('--'));
const outIdx = argv.indexOf('--out');
if (!file) {
  console.log('Usage: node build-cases.mjs <run>/test-cases.json [--out <dir>]');
  process.exit(1);
}
const OUT = path.resolve(outIdx >= 0 ? argv[outIdx + 1] : path.dirname(file));

let data;
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
} catch (e) {
  console.error(`Cannot read ${file}: ${e.message}`);
  process.exit(1);
}

const TYPES = ['happy', 'negative', 'edge'];
const TECHNIQUES = ['equivalence-partitioning', 'boundary-value', 'decision-table', 'state-transition', 'use-case', 'error-guessing', 'checklist'];
const PRIORITIES = ['P1', 'P2', 'P3'];
const LEVELS = ['unit', 'api', 'ui', 'manual'];
const STAGES = ['push', 'pr', 'nightly', 'release', 'none'];
const STATUSES = ['suggested', 'approved', 'rejected', 'changed'];
const APPROVALS = ['pending', 'partial', 'approved', 'rejected'];
const RISKS = ['high', 'medium', 'low'];
const VAGUE = /^(it |the (page|feature|system|app) )?(works|work|working|works (correctly|fine|properly|as expected)|as expected|correct|ok|okay|fine|success|successful|no errors?|no issues?|passes|behaves correctly|everything works)\.?$/i;

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const filled = (v) => (Array.isArray(v) ? v.filter((x) => String(x).trim()).length > 0 : typeof v === 'string' ? v.trim().length > 0 : v != null);

// ---------- checks ----------

const run = data.run || {};
const features = list(data.features);
const cases = list(data.cases);
const questions = list(data.questions);
const notCovered = list(data.not_covered);

for (const k of ['product', 'date', 'scope', 'summary']) if (!filled(run[k])) err('run', `missing "${k}"`);
if (!list(run.inputs).length) err('run', 'missing "inputs" (what was read: url, code, api, doc, build)');
for (const [i, inp] of list(run.inputs).entries()) if (!filled(inp.kind) || !filled(inp.ref)) err(`run.inputs[${i}]`, 'needs "kind" and "ref"');
if (!filled(run.risks)) err('run', 'missing "risks" (what hurts most if it breaks)');
const approval = run.approval || {};
if (!APPROVALS.includes(approval.status)) err('run.approval', `status must be one of ${APPROVALS.join(', ')}`);

const ids = new Set();
const seen = (id, where) => {
  if (!filled(id)) return err(where, 'missing "id"');
  if (ids.has(id)) err(where, `duplicate id "${id}"`);
  ids.add(id);
};

const featureById = new Map();
for (const f of features) {
  const w = `feature ${f.id || '?'}`;
  seen(f.id, w);
  featureById.set(f.id, f);
  if (!filled(f.name)) err(w, 'missing "name"');
  if (!RISKS.includes(f.risk)) err(w, `risk must be one of ${RISKS.join(', ')}`);
  if (!filled(f.risk_reason)) err(w, 'missing "risk_reason"');
  if (!filled(f.sources)) err(w, 'missing "sources" (where the feature was seen or read)');
  for (const r of list(f.rules)) {
    seen(r.id, `${w} rule`);
    if (!filled(r.text) || !filled(r.source)) err(`${w} rule ${r.id}`, 'needs "text" and "source"');
  }
}

for (const c of cases) {
  const w = `case ${c.id || '?'}`;
  seen(c.id, w);
  if (!featureById.has(c.feature)) err(w, `feature "${c.feature}" does not exist`);
  if (!filled(c.title)) err(w, 'missing "title"');
  if (!TYPES.includes(c.type)) err(w, `type must be one of ${TYPES.join(', ')}`);
  if (!TECHNIQUES.includes(c.technique)) err(w, `technique must be one of ${TECHNIQUES.join(', ')}`);
  if (!PRIORITIES.includes(c.priority)) err(w, `priority must be one of ${PRIORITIES.join(', ')}`);
  if (!filled(c.priority_reason)) err(w, 'missing "priority_reason"');
  if (!filled(c.preconditions)) err(w, 'missing "preconditions" (the starting state)');
  if (!filled(c.steps)) err(w, 'missing "steps"');
  if (!filled(c.expected)) err(w, 'missing "expected"');
  for (const e of list(c.expected)) {
    const t = String(e).trim();
    if (VAGUE.test(t) || t.length < 8) err(w, `expected result "${t}" is too vague: write the exact message, value, page or state`);
  }
  if (!filled(c.source)) err(w, 'missing "source" (the rule, file:line, URL or document section it checks)');
  const a = c.automation || {};
  if (!LEVELS.includes(a.level)) err(w, `automation.level must be one of ${LEVELS.join(', ')}`);
  if (!filled(a.reason)) err(w, 'missing "automation.reason"');
  if (!STAGES.includes(a.ci_stage)) err(w, `automation.ci_stage must be one of ${STAGES.join(', ')}`);
  if (a.level === 'manual' && ['push', 'pr', 'nightly'].includes(a.ci_stage)) err(w, 'a manual case cannot run in an automated CI stage (use "release" or "none")');
  if (a.level !== 'manual' && a.ci_stage === 'none') warn(w, `automated case (${a.level}) has no CI stage`);
  if (!STATUSES.includes(c.status)) err(w, `status must be one of ${STATUSES.join(', ')}`);
  if (['rejected', 'changed'].includes(c.status) && !filled(c.review_note)) warn(w, `status "${c.status}" without a "review_note"`);
  if (c.status !== 'suggested' && approval.status === 'pending') warn(w, `status "${c.status}" but run.approval.status is still "pending"`);
}

for (const f of features) {
  const fc = cases.filter((c) => c.feature === f.id);
  const has = (t) => fc.some((c) => c.type === t);
  if (!has('happy')) err(`feature ${f.id}`, 'has no happy path case');
  for (const t of ['negative', 'edge']) if (!has(t) && !filled(f.gaps)) warn(`feature ${f.id}`, `no ${t} case and no "gaps" note saying why`);
}

for (const q of questions) {
  const w = `question ${q.id || '?'}`;
  seen(q.id, w);
  if (!filled(q.question) || !filled(q.source) || !filled(q.why)) err(w, 'needs "question", "source" and "why"');
  for (const cid of list(q.cases)) if (!cases.some((c) => c.id === cid)) err(w, `links case "${cid}" that does not exist`);
}
for (const [i, n] of notCovered.entries()) if (!filled(n.area) || !filled(n.reason)) err(`not_covered[${i}]`, 'needs "area" and "reason"');

if (errors.length) {
  console.error(`\n${errors.length} problem(s) found. Nothing was written.\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  if (warnings.length) for (const w of warnings) console.error(`  ! ${w}`);
  process.exit(1);
}

// ---------- helpers ----------

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
const numbered = (arr) => list(arr).map((s, i) => `${i + 1}. ${s}`).join('\n');
const count = (arr, fn) => arr.filter(fn).length;
const active = cases.filter((c) => c.status !== 'rejected');
const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : '0%');

function countTable(title, values, getter, from = active) {
  const rows = values.map((v) => `| ${v} | ${count(from, (c) => getter(c) === v)} |`).join('\n');
  return `| ${title} | Cases |\n|---|---|\n${rows}`;
}

fs.mkdirSync(OUT, { recursive: true });
const header = `**Product:** ${esc(run.product)}${run.version ? ` (${esc(run.version)})` : ''} · **Date:** ${run.date} · **Scope:** ${esc(run.scope)}\n\n**Read from:** ${list(run.inputs).map((i) => `${i.kind}: ${i.ref}`).join(' · ')}\n\n**Approval:** ${approval.status}${approval.by ? ` by ${approval.by}` : ''}${approval.date ? ` on ${approval.date}` : ''}${approval.notes ? `. ${approval.notes}` : ''}`;

// ---------- test-cases.md ----------

let md = `# Test cases: ${run.product}\n\n${header}\n\n${run.summary}\n\n`;
md += `## Summary\n\n${active.length} cases in ${features.length} features`;
md += cases.length !== active.length ? ` (${cases.length - active.length} rejected, not counted).` : '.';
md += ` ${questions.length} open question(s). See [coverage.md](coverage.md) and [questions.md](questions.md).\n\n`;
md += `| Type | Cases | | Priority | Cases | | Automation | Cases |\n|---|---|---|---|---|---|---|---|\n`;
const rowsN = Math.max(TYPES.length, PRIORITIES.length, LEVELS.length);
for (let i = 0; i < rowsN; i++) {
  const t = TYPES[i], p = PRIORITIES[i], l = LEVELS[i];
  md += `| ${t || ''} | ${t ? count(active, (c) => c.type === t) : ''} | | ${p || ''} | ${p ? count(active, (c) => c.priority === p) : ''} | | ${l || ''} | ${l ? count(active, (c) => c.automation.level === l) : ''} |\n`;
}
md += `\n**What hurts most if it breaks:** ${list(run.risks).map(esc).join('; ')}.\n\n`;
if (run.existing_tests) md += `**Existing tests:** ${esc(run.existing_tests)}\n\n`;

for (const f of features) {
  const fc = cases.filter((c) => c.feature === f.id);
  md += `## ${f.name} (${f.id})\n\nRisk: **${f.risk}**. ${esc(f.risk_reason)}. Source: ${list(f.sources).map(esc).join('; ')}.\n\n`;
  if (list(f.rules).length) {
    md += `Rules found:\n\n${list(f.rules).map((r) => `- **${r.id}** ${esc(r.text)} *(${esc(r.source)})*`).join('\n')}\n\n`;
  }
  if (f.gaps) md += `Gaps: ${esc(f.gaps)}\n\n`;
  md += `| ID | Title | Type | Priority | Automation | Status |\n|---|---|---|---|---|---|\n`;
  for (const c of fc) md += `| [${c.id}](#${c.id.toLowerCase()}) | ${esc(c.title)} | ${c.type} | ${c.priority} | ${c.automation.level} · ${c.automation.ci_stage} | ${c.status} |\n`;
  md += '\n';
  for (const c of fc) {
    md += `### ${c.id}\n\n**${esc(c.title)}**\n\n`;
    md += `- **Type:** ${c.type} · **Technique:** ${c.technique} · **Priority:** ${c.priority} (${esc(c.priority_reason)})\n`;
    md += `- **Automation:** ${c.automation.level}, CI stage ${c.automation.ci_stage}. ${esc(c.automation.reason)}\n`;
    md += `- **Source:** ${esc(c.source)}\n`;
    if (filled(c.assumption)) md += `- **Assumption:** ${esc(c.assumption)}\n`;
    md += `- **Status:** ${c.status}${c.review_note ? `. ${esc(c.review_note)}` : ''}\n\n`;
    md += `Preconditions:\n\n${list(c.preconditions).map((p) => `- ${p}`).join('\n')}\n\n`;
    if (filled(c.data)) md += `Test data: ${c.data}\n\n`;
    md += `Steps:\n\n${numbered(c.steps)}\n\nExpected:\n\n${list(c.expected).map((e) => `- ${e}`).join('\n')}\n\n`;
  }
}
if (notCovered.length) {
  md += `## Not covered\n\n| Area | Reason |\n|---|---|\n${notCovered.map((n) => `| ${esc(n.area)} | ${esc(n.reason)} |`).join('\n')}\n`;
}
fs.writeFileSync(path.join(OUT, 'test-cases.md'), md);

// ---------- test-cases.csv ----------

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const COLS = ['ID', 'Feature', 'Title', 'Type', 'Technique', 'Priority', 'Priority reason', 'Preconditions', 'Steps', 'Test data', 'Expected result', 'Automation level', 'Automation reason', 'CI stage', 'Source', 'Assumption', 'Status'];
const csvRows = cases.map((c) => [
  c.id, featureById.get(c.feature).name, c.title, c.type, c.technique, c.priority, c.priority_reason,
  list(c.preconditions).join('\n'), numbered(c.steps), c.data || '', numbered(c.expected),
  c.automation.level, c.automation.reason, c.automation.ci_stage, c.source, c.assumption || '', c.status,
].map(csvCell).join(','));
fs.writeFileSync(path.join(OUT, 'test-cases.csv'), '﻿' + [COLS.map(csvCell).join(','), ...csvRows].join('\r\n') + '\r\n');

// ---------- coverage.md ----------

let cov = `# Coverage: ${run.product}\n\n${header}\n\n`;
cov += `Each feature and how many cases it has of each type. Rejected cases are not counted. A dash means no case: the "Gaps" column says why.\n\n`;
cov += `| Feature | Risk | Happy | Negative | Edge | Total | P1 | Unit | API | UI | Manual | Gaps |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
for (const f of features) {
  const fc = active.filter((c) => c.feature === f.id);
  const n = (fn) => count(fc, fn) || '—';
  cov += `| ${esc(f.name)} | ${f.risk} | ${n((c) => c.type === 'happy')} | ${n((c) => c.type === 'negative')} | ${n((c) => c.type === 'edge')} | ${fc.length} | ${n((c) => c.priority === 'P1')} | ${n((c) => c.automation.level === 'unit')} | ${n((c) => c.automation.level === 'api')} | ${n((c) => c.automation.level === 'ui')} | ${n((c) => c.automation.level === 'manual')} | ${esc(f.gaps || '')} |\n`;
}
const automated = count(active, (c) => c.automation.level !== 'manual');
cov += `\n**Automation:** ${automated} of ${active.length} cases (${pct(automated, active.length)}) are suggested for automation. ${active.length - automated} stay manual.\n\n`;
cov += `${countTable('CI stage', STAGES, (c) => c.automation.ci_stage)}\n\n`;
cov += `${countTable('Technique', TECHNIQUES, (c) => c.technique)}\n\n`;
cov += `${countTable('Status (all cases)', STATUSES, (c) => c.status, cases)}\n\n`;
if (notCovered.length) cov += `## Not covered\n\n| Area | Reason |\n|---|---|\n${notCovered.map((n) => `| ${esc(n.area)} | ${esc(n.reason)} |`).join('\n')}\n`;
fs.writeFileSync(path.join(OUT, 'coverage.md'), cov);

// ---------- questions.md ----------

let qmd = `# Questions for the team: ${run.product}\n\nThese are not bugs. The product does not say what should happen, or it does something that looks surprising. The team decides.\n\n`;
if (!questions.length) qmd += 'No open questions.\n';
else {
  qmd += `| ID | Question | Why it matters | Source | Cases |\n|---|---|---|---|---|\n`;
  qmd += questions.map((q) => `| ${q.id} | ${esc(q.question)} | ${esc(q.why)} | ${esc(q.source)} | ${list(q.cases).join(', ')} |`).join('\n') + '\n';
}
fs.writeFileSync(path.join(OUT, 'questions.md'), qmd);

// ---------- done ----------

console.log(`OK: ${cases.length} cases, ${features.length} features, ${questions.length} questions.`);
console.log(`  happy ${count(active, (c) => c.type === 'happy')} · negative ${count(active, (c) => c.type === 'negative')} · edge ${count(active, (c) => c.type === 'edge')}`);
console.log(`  P1 ${count(active, (c) => c.priority === 'P1')} · P2 ${count(active, (c) => c.priority === 'P2')} · P3 ${count(active, (c) => c.priority === 'P3')}`);
console.log(`  unit ${count(active, (c) => c.automation.level === 'unit')} · api ${count(active, (c) => c.automation.level === 'api')} · ui ${count(active, (c) => c.automation.level === 'ui')} · manual ${count(active, (c) => c.automation.level === 'manual')}`);
console.log(`  status: ${STATUSES.map((s) => `${s} ${count(cases, (c) => c.status === s)}`).join(' · ')}`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}
console.log(`\nWrote ${['test-cases.md', 'test-cases.csv', 'coverage.md', 'questions.md'].map((f) => path.join(OUT, f)).join('\n      ')}`);
