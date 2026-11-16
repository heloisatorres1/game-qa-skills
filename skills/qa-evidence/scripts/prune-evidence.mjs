#!/usr/bin/env node
// Lists (or deletes with --apply) evidence files that no finding or coverage row references,
// so a report you share or commit only carries the proof it uses.
//
//   node prune-evidence.mjs <findings.json> [more.json ...] [--apply] [--keep <name>]...
//
// Files named results.json are kept by default (the raw check log). Folders referenced as evidence
// (frame sequences) are kept with everything inside them.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const keep = new Set(['results.json']);
const inputs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--apply') continue;
  if (args[i] === '--keep') { keep.add(args[++i]); continue; }
  inputs.push(args[i]);
}
if (!inputs.length) { console.log('Usage: node prune-evidence.mjs <findings.json> [more.json ...] [--apply] [--keep <name>]'); process.exit(1); }

let total = 0, bytes = 0;
for (const input of inputs) {
  const file = path.resolve(input);
  const dir = path.dirname(file);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const used = new Set();
  const add = (p) => { if (p && !/^https?:/.test(p)) used.add(path.resolve(dir, p)); };
  for (const f of data.findings || []) for (const ev of f.evidence || []) add(ev.path);
  for (const c of data.coverage || []) for (const ev of c.evidence || []) add(typeof ev === 'string' ? ev : ev.path);
  const evDir = path.join(dir, 'evidence');
  if (!fs.existsSync(evDir)) continue;
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return used.has(p) ? [] : walk(p);
    return [p];
  });
  const unused = walk(evDir).filter((p) => !used.has(p) && !keep.has(path.basename(p)));
  for (const p of unused) {
    const size = fs.statSync(p).size; total++; bytes += size;
    console.log(`${apply ? 'deleted' : 'unused '}  ${path.relative(process.cwd(), p)}  (${Math.round(size / 1024)} KB)`);
    if (apply) fs.unlinkSync(p);
  }
  if (apply) for (const d of fs.readdirSync(evDir, { withFileTypes: true })) {
    const p = path.join(evDir, d.name);
    if (d.isDirectory() && !fs.readdirSync(p).length) fs.rmdirSync(p);
  }
}
console.log(`\n${total} file(s), ${(bytes / 1048576).toFixed(1)} MB ${apply ? 'deleted' : 'unreferenced (run with --apply to delete)'}`);
