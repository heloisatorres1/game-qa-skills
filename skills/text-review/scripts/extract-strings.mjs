#!/usr/bin/env node
// Collects text that players may see, from any engine or framework, and runs
// mechanical checks on it. It does not judge spelling or grammar: that is the
// reviewer's job. It makes sure no string is missed and every string has a
// file:line so findings can be proven.
//
//   node extract-strings.mjs <project-root> [--out <dir>] [--no-code] [--include <glob-ish substring>] [--exclude <substring>]
//
// Writes <out>/strings.json (full data) and <out>/strings.txt (one line per string, easy to read).

import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', 'out', 'release', 'coverage', 'vendor', 'vendors', 'third_party', 'thirdparty',
  'Library', 'Temp', 'Logs', 'obj', 'bin', 'Binaries', 'Intermediate', 'DerivedDataCache', 'Saved', '.godot', '.import',
  'android', 'ios', 'Pods', '.gradle', '.idea', '.vscode', 'qa-reports', '__pycache__', '.venv', 'venv', 'Packages',
]);
const CODE_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.gd', '.cs', '.cpp', '.cc', '.h', '.hpp', '.lua', '.py', '.rpy', '.hx', '.java', '.kt', '.swift', '.dart', '.gml', '.vue', '.svelte']);
const MAX_FILE_BYTES = 3_000_000;

const args = parseArgs(process.argv.slice(2));
if (!args.root) {
  console.log('Usage: node extract-strings.mjs <project-root> [--out <dir>] [--no-code] [--include <substr>] [--exclude <substr>]');
  process.exit(1);
}
const ROOT = path.resolve(args.root);
const OUT = path.resolve(args.out || 'qa-reports/strings');

function parseArgs(argv) {
  const a = { root: null, out: null, code: true, include: [], exclude: [] };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--out') a.out = argv[++i];
    else if (v === '--no-code') a.code = false;
    else if (v === '--include') a.include.push(argv[++i]);
    else if (v === '--exclude') a.exclude.push(argv[++i]);
    else a.root = v;
  }
  return a;
}

// ---------- file walk ----------

function* walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
      yield* walk(p);
    } else if (e.isFile()) yield p;
  }
}

function rel(p) { return path.relative(ROOT, p).split(path.sep).join('/'); }

function lineAt(text, index) {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

// Fast line lookup for big files.
function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return (idx) => {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= idx) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };
}

// ---------- "is this prose?" heuristics ----------

const NOT_PROSE = [
  /^https?:\/\//i, /^www\./i, /^[\w.-]+@[\w.-]+$/, /^#[0-9a-f]{3,8}$/i, /^rgba?\(/i, /^hsla?\(/i,
  /^[\w./\\-]+\.(png|jpe?g|gif|webp|svg|mp3|ogg|wav|json|js|css|html|ttf|woff2?|tscn|tres|prefab|asset|uasset)$/i,
  /^[.#]?[a-z][\w-]*([.#\s>:[\]=~+-]+[\w-]+)*$/, // css selectors / ids / kebab-case
  /^[a-z]+([A-Z][a-z0-9]*)+$/, // camelCase
  /^[A-Z0-9_]+$/, // CONSTANTS
  /^[a-z0-9_]+$/, // snake_case / single lowercase token
  /^\W*$/, /^[\d\s.,:%x+\-*/=()]+$/, // numbers / math
  /^(px|em|rem|vh|vw|ms|s)$/, /^\d+(px|em|rem|%|ms|s|vh|vw)$/,
  /^(application|image|audio|video|text)\/[\w.+-]+$/,
  /^(GET|POST|PUT|DELETE|PATCH)$/, /^(true|false|null|undefined|none|auto|inherit)$/i,
  /^[\w-]+:[\w-]+$/, // key:value tokens
  /^([\w-]+\s*:\s*[^;]+;\s*)+[\w-]*\s*:?[^;]*$/, // inline CSS declarations
  /^(translate|rotate|scale|matrix|cubic-bezier|linear-gradient|radial-gradient|url)\(/i,
  /^["']?[\w\s-]+["']?,\s*(sans-serif|serif|monospace|cursive)/i, // font stacks
];

function looksLikeProse(s) {
  const t = s.trim();
  if (t.length < 2) return false;
  if (!/[A-Za-zÀ-ÿ]{2}/.test(t)) return false;
  for (const re of NOT_PROSE) if (re.test(t)) return false;
  if (/[{};]\s*$/.test(t) && /[=(){}]/.test(t)) return false; // code fragments
  if (/^<\/?[a-z]/i.test(t) && />$/.test(t) && !/>[^<]*[A-Za-z]{2}[^<]*</.test(t)) return false; // bare tags
  if (/\s/.test(t)) return true; // multiple words
  return /^[A-ZÀ-Ý][a-zà-ÿ]+[!?.…]*$/.test(t) || /[!?…]$/.test(t); // Capitalised single word ("Play", "Settings") or exclamation
}

// Lines in code that are almost never player-facing.
const CODE_LINE_SKIP = /(console\.(log|warn|error|info|debug)|\bimport\b|\brequire\(|querySelector|getElementById|addEventListener|removeEventListener|classList|dataset|setAttribute\(\s*['"](class|id|style|data-)|\bDebug\.Log|\bprint_debug\b|\bpush_error\b|\bpush_warning\b|\bUE_LOG\b|\blogger\.|\bthrow new\b|\bassert\b|getComponent|GetComponent|Resources\.Load|preload\(|load\(\s*["']res:|new RegExp|\.test\(|\.match\(|\.replace\()/;

// ---------- template / markup cleanup ----------

const INLINE_TAGS = new Set(['b', 'i', 'em', 'strong', 'u', 'a', 'span', 'small', 'sup', 'sub', 'mark', 'code', 'kbd', 'img', 'br', 'svg', 'abbr']);

function decodeEntities(s) {
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&hellip;/g, '…').replace(/&mdash;/g, '—');
}

// Splits markup into the text runs a player reads as one piece: inline tags
// (<b>, <span>, icons) inside a sentence are joined, block tags and two tags
// with nothing between them start a new run. Returns [{ offset, text }].
function htmlRuns(s) {
  const runs = [];
  let cur = '', start = -1, prevClosed = false;
  const flush = () => {
    const t = decodeEntities(cur).replace(/\s+/g, ' ').trim();
    if (t && t !== '[icon]') runs.push({ offset: start, text: t });
    cur = ''; start = -1;
  };
  const re = /<\/?([a-zA-Z][\w-]*)[^>]*>|([^<]+)/g;
  let m;
  while ((m = re.exec(s))) {
    if (m[2] !== undefined) {
      if (m[2].trim()) {
        if (start < 0) start = m.index + (m[2].length - m[2].trimStart().length);
        prevClosed = false;
      }
      cur += m[2];
      continue;
    }
    const name = m[1].toLowerCase();
    const closing = m[0].startsWith('</');
    if (!INLINE_TAGS.has(name)) { flush(); prevClosed = false; continue; }
    // "</b><span>": an element ends and another starts with no text between them.
    if (!closing && prevClosed) flush();
    // "No Ads<small>Remove ads</small>": a box tag glued to text is styled as its own line.
    else if (!closing && ['span', 'small', 'mark', 'abbr'].includes(name) && /\S$/.test(cur)) flush();
    if (name === 'br') cur += ' ';
    else if (name === 'img' || name === 'svg') { if (start < 0) start = m.index; cur += ' [icon] '; }
    prevClosed = closing || name === 'img' || name === 'br';
  }
  flush();
  return runs;
}

function stripTags(s) {
  return htmlRuns(s).map((r) => r.text).join('\n');
}

// ---------- extractors ----------

const strings = [];
let seq = 0;
function add(file, line, kind, text, extra = {}) {
  const clean = text.replace(/\r/g, '');
  if (!clean.trim()) return;
  strings.push({ id: `S${String(++seq).padStart(4, '0')}`, file: rel(file), line, kind, text: clean, ...extra });
}

// Small tokenizer for C-like and script languages. Returns string literals with
// their offset. Template literals keep their text and replace each ${...}
// expression with {…}; strings inside those expressions are returned too.
function tokenizeStrings(text, hashComments) {
  const out = [];
  let i = 0;
  const n = text.length;
  function readQuoted(q, start) {
    let j = start + 1, val = '';
    while (j < n && text[j] !== q) {
      if (text[j] === '\\') { val += text.slice(j, j + 2); j += 2; continue; }
      if (text[j] === '\n') return { end: j, val: null }; // unterminated: not a string
      val += text[j++];
    }
    return { end: j + 1, val };
  }
  function readTemplate(start) {
    let j = start + 1, val = '';
    while (j < n && text[j] !== '`') {
      if (text[j] === '\\') { val += text.slice(j, j + 2); j += 2; continue; }
      if (text[j] === '$' && text[j + 1] === '{') {
        // scan expression with brace depth, collecting nested strings
        let depth = 1; j += 2;
        while (j < n && depth > 0) {
          const ch = text[j];
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
          else if (ch === '"' || ch === "'") { const r = readQuoted(ch, j); if (r.val !== null) out.push({ index: j, quote: ch, raw: r.val }); j = r.end; continue; }
          else if (ch === '`') { const r = readTemplate(j); out.push({ index: j, quote: '`', raw: r.val }); j = r.end; continue; }
          j++;
        }
        val += '${}';
        continue;
      }
      val += text[j++];
    }
    return { end: j + 1, val };
  }
  while (i < n) {
    const ch = text[i];
    if (ch === '/' && text[i + 1] === '/') { while (i < n && text[i] !== '\n') i++; continue; }
    if (ch === '/' && text[i + 1] === '*') { const e = text.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (hashComments && ch === '#') { while (i < n && text[i] !== '\n') i++; continue; }
    if (ch === '"' || ch === "'") {
      // Python/GDScript triple quotes
      if (text.slice(i, i + 3) === ch.repeat(3)) { const e = text.indexOf(ch.repeat(3), i + 3); if (e > 0) { out.push({ index: i, quote: ch, raw: text.slice(i + 3, e) }); i = e + 3; continue; } }
      const r = readQuoted(ch, i);
      if (r.val !== null) out.push({ index: i, quote: ch, raw: r.val });
      i = r.end; continue;
    }
    if (ch === '`') { const start = i; const r = readTemplate(i); out.push({ index: start, quote: '`', raw: r.val }); i = r.end; continue; }
    i++;
  }
  return out.sort((a, b) => a.index - b.index);
}

function extractCode(file, text) {
  const lineOf = lineIndex(text);
  const lines = text.split('\n');
  const ext = path.extname(file).toLowerCase();
  const hash = ['.py', '.gd', '.rpy'].includes(ext);
  for (const tok of tokenizeStrings(text, hash)) {
    const line = lineOf(tok.index);
    const src = lines[line - 1] || '';
    if (CODE_LINE_SKIP.test(src)) continue;
    let value = tok.raw.replace(/\\n/g, '\n').replace(/\\(["'`\\])/g, '$1').replace(/\$\{\}/g, '{…}');
    const kind = 'code-literal';
    if (/<[a-z][^>]*>/i.test(value)) {
      // HTML built in code: pull text nodes out of it
      const parts = stripTags(value).split(/\n|\s{2,}/).map((x) => x.trim()).filter(Boolean);
      for (const p of parts) if (looksLikeProse(p.replace(/\{…\}/g, 'X'))) add(file, line, 'code-markup', p);
      for (const a of value.matchAll(/\b(alt|title|placeholder|aria-label)\s*=\s*"([^"$]+)"/gi)) if (looksLikeProse(a[2])) add(file, line, 'code-markup', a[2], { attr: a[1] });
      continue;
    }
    if (!looksLikeProse(value.replace(/\{…\}/g, 'X'))) continue;
    add(file, line, kind, value.trim());
  }
}

function extractHtml(file, text) {
  const lineOf = lineIndex(text);
  const masked = text.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, (c) => c.replace(/[^\n]/g, ' ')).replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '));
  for (const run of htmlRuns(masked)) {
    if (looksLikeProse(run.text.replace(/\[icon\]/g, ''))) add(file, lineOf(run.offset), 'markup', run.text);
  }
  for (const a of masked.matchAll(/\b(alt|title|placeholder|aria-label|content|value)\s*=\s*"([^"]+)"/gi)) {
    if (a[1].toLowerCase() === 'content' && !/name="(description|og:title|og:description|application-name)"/i.test(masked.slice(Math.max(0, a.index - 120), a.index + 200))) continue;
    if (looksLikeProse(a[2])) add(file, lineOf(a.index), 'markup-attr', a[2], { attr: a[1] });
  }
}

const TEXT_KEYS = /(text|title|name|label|desc|description|message|msg|tooltip|hint|dialog|dialogue|line|caption|subtitle|button|prompt|story|body|content|header|footer|tip)/i;

function extractJson(file, text) {
  let data;
  try { data = JSON.parse(text); } catch { return; }
  const lineOf = lineIndex(text);
  const visit = (node, keyPath) => {
    if (typeof node === 'string') {
      const key = keyPath[keyPath.length - 1] || '';
      if (looksLikeProse(node) || (TEXT_KEYS.test(String(key)) && /[A-Za-z]{2}/.test(node) && !/^[\w./-]+$/.test(node))) {
        const idx = text.indexOf(JSON.stringify(node).slice(1, -1));
        add(file, idx >= 0 ? lineOf(idx) : 1, 'data', node, { key: keyPath.join('.') });
      }
    } else if (Array.isArray(node)) node.forEach((v, i) => visit(v, [...keyPath, i]));
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) visit(v, [...keyPath, k]);
  };
  visit(data, []);
}

function parseCsvLine(line, sep) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === sep) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur); return out;
}

const localeRows = []; // { file, line, key, values: {lang: text} } for placeholder comparison

function extractTable(file, text, sep) {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return;
  const header = parseCsvLine(lines[0], sep).map((h) => h.trim());
  const isLocTable = header.length >= 2 && header.slice(1).some((h) => /^[a-z]{2}([-_][A-Za-z]{2,4})?$/i.test(h) || /^(english|french|german|spanish|portuguese|italian|japanese|korean|chinese|russian|text|source|translation)$/i.test(h));
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cells = parseCsvLine(lines[i], sep);
    const row = { file: rel(file), line: i + 1, key: cells[0], values: {} };
    cells.forEach((c, j) => {
      if (j === 0 && isLocTable) return;
      if (looksLikeProse(c) || (isLocTable && c.trim())) {
        add(file, i + 1, isLocTable ? 'locale-table' : 'data-table', c, { key: cells[0], column: header[j] || String(j) });
        row.values[header[j] || String(j)] = c;
      }
    });
    if (isLocTable && Object.keys(row.values).length > 1) localeRows.push(row);
  }
}

function extractPo(file, text) {
  const re = /msgid\s+((?:"(?:\\.|[^"\\])*"\s*)+)msgstr\s+((?:"(?:\\.|[^"\\])*"\s*)+)/g;
  const join = (s) => [...s.matchAll(/"((?:\\.|[^"\\])*)"/g)].map((x) => x[1]).join('').replace(/\\n/g, '\n').replace(/\\"/g, '"');
  const lineOf = lineIndex(text);
  let m;
  while ((m = re.exec(text))) {
    const id = join(m[1]); const str = join(m[2]);
    const line = lineOf(m.index);
    if (id) add(file, line, 'locale-po', id, { key: 'msgid' });
    if (str) add(file, line, 'locale-po', str, { key: 'msgstr' });
    if (id && str) localeRows.push({ file: rel(file), line, key: id.slice(0, 40), values: { source: id, translation: str } });
  }
}

function extractXmlLike(file, text) {
  const lineOf = lineIndex(text);
  for (const m of text.matchAll(/<string\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/string>/g)) add(file, lineOf(m.index), 'locale-xml', stripTags(m[2]).trim(), { key: m[1] });
  for (const m of text.matchAll(/<data\s+name="([^"]+)"[^>]*>\s*<value>([\s\S]*?)<\/value>/g)) add(file, lineOf(m.index), 'locale-resx', m[2].trim(), { key: m[1] });
  for (const m of text.matchAll(/<(source|target)>([\s\S]*?)<\/\1>/g)) add(file, lineOf(m.index), 'locale-xliff', stripTags(m[2]).trim(), { key: m[1] });
}

function extractAppleStrings(file, text) {
  const lineOf = lineIndex(text);
  for (const m of text.matchAll(/"((?:\\.|[^"\\])*)"\s*=\s*"((?:\\.|[^"\\])*)"\s*;/g)) add(file, lineOf(m.index), 'locale-strings', m[2], { key: m[1] });
}

function extractEngineScene(file, text) {
  const lineOf = lineIndex(text);
  // Godot .tscn/.tres
  for (const m of text.matchAll(/^\s*(text|tooltip_text|placeholder_text|title|dialog_text|hint_tooltip)\s*=\s*"((?:\\.|[^"\\])*)"/gm)) add(file, lineOf(m.index), 'scene', m[2].replace(/\\n/g, '\n'), { key: m[1] });
  // Unity YAML (UGUI Text / TextMeshPro)
  for (const m of text.matchAll(/^\s*m_[Tt]ext:\s*(.+)$/gm)) {
    let v = m[1].trim();
    if (v.startsWith("'") || v.startsWith('"')) v = v.slice(1, -1);
    if (v) add(file, lineOf(m.index), 'scene', v.replace(/\\n/g, '\n'), { key: 'm_Text' });
  }
}

function extractYaml(file, text) {
  const lineOf = lineIndex(text);
  for (const m of text.matchAll(/^\s*([\w.-]+)\s*:\s*["']?(.+?)["']?\s*$/gm)) {
    if (looksLikeProse(m[2]) || (TEXT_KEYS.test(m[1]) && /\s/.test(m[2]))) add(file, lineOf(m.index), 'data', m[2], { key: m[1] });
  }
}

// ---------- checks ----------

const PLACEHOLDER = /(\{[\w…]*\}|%\d*\$?[sdif@]|%\{[\w]+\}|\$\{[^}]*\}|\[[A-Z_]+\]|<[a-z]+[^>]*>)/g;

function lint(s) {
  const t = s.text;
  const flags = [];
  if (/ {2,}/.test(t.trim())) flags.push('double-space');
  if (t !== t.replace(/^[ \t]+|[ \t]+$/g, '') && s.kind !== 'markup') flags.push('leading/trailing space');
  const rep = /\b([A-Za-zÀ-ÿ']+)\s+\1\b/i.exec(t);
  if (rep && !/^(ha|bye|no|very|so|knock|tick|boo|la|na)$/i.test(rep[1])) flags.push(`repeated word "${rep[1]}"`);
  if (/[A-Za-z] +[,.!?;:](?!\w)/.test(t) && !/\{…\}\s+[,.!?]/.test(t)) flags.push('space before punctuation');
  if (/[a-z][,;][A-Za-z]/.test(t) || /[a-z]{2}[.!?][A-Z][a-z]/.test(t)) flags.push('missing space after punctuation');
  if (/[.!?]\s+[a-z]/.test(t) && !/\b(e\.g|i\.e|etc|vs|approx)\.\s/i.test(t)) flags.push('lowercase after sentence end');
  for (const [o, c] of [['(', ')'], ['[', ']'], ['{', '}']]) if (t.split(o).length !== t.split(c).length) flags.push(`unbalanced ${o}${c}`);
  if ((t.match(/"/g) || []).length % 2) flags.push('unbalanced "');
  if (/\.\.\.\.|!!!|\?\?\?/.test(t)) flags.push('repeated punctuation');
  if (/\b(lorem|ipsum|todo|fixme|tbd|xxx|placeholder|asdf|test123)\b/i.test(t)) flags.push('placeholder/dev text');
  if (/\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/.test(t)) flags.push('possible leaked value');
  if (/\b[A-Za-z]{2,} s\b/.test(t)) flags.push('possible broken apostrophe');
  if (/\{…\}\s*\w+s\b/.test(t) && /\b(\d+|\{…\}) (\w+)\b/.test(t)) flags.push('check plural with variable');
  return flags;
}

function placeholders(t) { return [...(t.match(PLACEHOLDER) || [])].sort().join(' '); }

function globalChecks() {
  const out = [];
  // Capitalisation variants of the same text: "Play again" vs "Play Again"
  const byLower = new Map();
  for (const s of strings) {
    const k = s.text.trim().toLowerCase();
    if (!byLower.has(k)) byLower.set(k, new Map());
    const variants = byLower.get(k);
    if (!variants.has(s.text.trim())) variants.set(s.text.trim(), []);
    variants.get(s.text.trim()).push(s.id);
  }
  for (const variants of byLower.values()) {
    if (variants.size > 1) out.push({ check: 'inconsistent capitalisation', variants: Object.fromEntries(variants) });
  }
  // Ellipsis style
  const three = strings.filter((s) => /\.\.\./.test(s.text)).map((s) => s.id);
  const single = strings.filter((s) => /…/.test(s.text.replace(/\{…\}/g, ''))).map((s) => s.id);
  if (three.length && single.length) out.push({ check: 'mixed ellipsis styles ("..." and "…")', three_dots: three, ellipsis_char: single });
  // Quote style
  const straight = strings.filter((s) => /\b'\w|\w'\b/.test(s.text)).length;
  const curly = strings.filter((s) => /[’‘]/.test(s.text)).length;
  if (straight && curly) out.push({ check: 'mixed apostrophe styles (\' and ’)', straight, curly });
  // Placeholder mismatch across translations
  for (const row of localeRows) {
    const sets = Object.entries(row.values).map(([lang, v]) => [lang, placeholders(v)]);
    const base = sets[0][1];
    const bad = sets.filter(([, p]) => p !== base);
    if (bad.length) out.push({ check: 'placeholder mismatch between languages', file: row.file, line: row.line, key: row.key, placeholders: Object.fromEntries(sets) });
  }
  return out;
}

// ---------- main ----------

let scanned = 0;
const byExt = {};
for (const file of walk(ROOT)) {
  const r = rel(file);
  if (args.include.length && !args.include.some((s) => r.includes(s))) continue;
  if (args.exclude.some((s) => r.includes(s))) continue;
  if (/\.min\.(js|css)$/.test(r)) continue;
  let stat; try { stat = fs.statSync(file); } catch { continue; }
  if (stat.size > MAX_FILE_BYTES) continue;
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file).toLowerCase();
  if (base === 'package.json' || base === 'package-lock.json' || base.endsWith('.lock') || base === 'tsconfig.json' || base === 'manifest.json' && false) continue;
  let text;
  const known = ['.html', '.htm', '.json', '.archive', '.csv', '.tsv', '.po', '.pot', '.xml', '.resx', '.xlf', '.xliff', '.strings', '.tscn', '.tres', '.prefab', '.unity', '.asset', '.yaml', '.yml'];
  if (!known.includes(ext) && !(args.code && CODE_EXT.has(ext))) continue;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  if (text.includes('\u0000')) continue; // binary
  scanned++;
  byExt[ext] = (byExt[ext] || 0) + 1;
  const before = strings.length;
  if (ext === '.html' || ext === '.htm') extractHtml(file, text);
  else if (ext === '.json' || ext === '.archive') extractJson(file, text);
  else if (ext === '.csv') extractTable(file, text, ',');
  else if (ext === '.tsv') extractTable(file, text, '\t');
  else if (ext === '.po' || ext === '.pot') extractPo(file, text);
  else if (['.xml', '.resx', '.xlf', '.xliff'].includes(ext)) extractXmlLike(file, text);
  else if (ext === '.strings') extractAppleStrings(file, text);
  else if (['.tscn', '.tres', '.prefab', '.unity', '.asset'].includes(ext)) extractEngineScene(file, text);
  else if (ext === '.yaml' || ext === '.yml') extractYaml(file, text);
  else extractCode(file, text);
  if (strings.length === before) byExt[ext + ' (no text)'] = (byExt[ext + ' (no text)'] || 0) + 1;
}

for (const s of strings) {
  const f = lint(s);
  if (f.length) s.flags = f;
}
const global = globalChecks();

fs.mkdirSync(OUT, { recursive: true });
const result = {
  root: path.basename(ROOT),
  generated: new Date().toISOString(),
  files_scanned: scanned,
  total_strings: strings.length,
  by_kind: strings.reduce((a, s) => ((a[s.kind] = (a[s.kind] || 0) + 1), a), {}),
  flagged: strings.filter((s) => s.flags).length,
  global_checks: global,
  strings,
};
fs.writeFileSync(path.join(OUT, 'strings.json'), JSON.stringify(result, null, 2));
const txt = strings.map((s) => `${s.id}\t${s.file}:${s.line}\t${s.kind}${s.key ? ` [${s.key}]` : ''}\t${s.text.replace(/\n/g, '⏎')}${s.flags ? `\t⚑ ${s.flags.join('; ')}` : ''}`);
fs.writeFileSync(path.join(OUT, 'strings.txt'), txt.join('\n') + '\n');

console.log(`Scanned ${scanned} files, found ${strings.length} candidate strings (${result.flagged} flagged by mechanical checks, ${global.length} global consistency notes).`);
console.log('By kind:', JSON.stringify(result.by_kind));
console.log(`Wrote ${path.join(OUT, 'strings.json')}`);
console.log(`Wrote ${path.join(OUT, 'strings.txt')}`);
