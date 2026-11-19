#!/usr/bin/env node
// Finds the rules hidden in source code that test cases should check:
// input limits, validators, numeric boundaries, error messages, states and
// API routes. Any language. It is deliberately generous: it prefers false
// positives to missed rules. You decide which ones matter.
//
//   node scan-rules.mjs <project-root> [--out <dir>] [--exclude <substring>]...
//
// Writes <out>/rules.json (every match with file:line) and <out>/rules.md (grouped, easy to read).

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const excludes = [];
let root = null;
let out = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--out') out = argv[++i];
  else if (argv[i] === '--exclude') excludes.push(argv[++i]);
  else root = argv[i];
}
if (!root) {
  console.log('Usage: node scan-rules.mjs <project-root> [--out <dir>] [--exclude <substring>]');
  process.exit(1);
}
const ROOT = path.resolve(root);
const OUT = path.resolve(out || 'qa-reports/inventory');

const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', 'out', 'release', 'coverage', 'vendor', 'vendors', 'third_party', 'thirdparty',
  'Library', 'Temp', 'Logs', 'obj', 'bin', 'Binaries', 'Intermediate', 'android', 'ios', 'Pods', '.gradle', '.idea',
  '.vscode', 'qa-reports', '__pycache__', '.venv', 'venv', 'Packages', '.next', '.nuxt', 'target', 'test-results', 'playwright-report',
]);
const EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.vue', '.svelte', '.html', '.htm', '.php', '.py', '.rb', '.java', '.kt', '.cs', '.cshtml', '.razor', '.go', '.rs', '.swift', '.dart', '.gd', '.lua', '.cpp', '.h', '.json', '.yaml', '.yml', '.sql', '.prisma', '.graphql']);
const MAX_BYTES = 1_500_000;

// Each rule: category, a regex, and what to report.
const RULES = [
  // HTML and component attributes
  { cat: 'input-limit', re: /\b(maxlength|minlength|maxLength|minLength)\s*=\s*\{?\s*["']?(\d+)/g, label: (m) => `${m[1]}=${m[2]}` },
  { cat: 'input-limit', re: /<(?:input|textarea|select)[^>]*\b(min|max|step|pattern)\s*=\s*["']([^"']+)["']/gi, label: (m) => `${m[1]}=${m[2]}` },
  { cat: 'input-limit', re: /<(?:input|textarea|select)[^>]*\brequired\b/gi, label: () => 'required field' },
  { cat: 'input-limit', re: /<input[^>]*\btype\s*=\s*["'](email|number|tel|url|date|time|datetime-local|password|file|range)["']/gi, label: (m) => `input type=${m[1]}` },
  // Validation libraries: zod, yup, joi, class-validator, Java Bean Validation, .NET, Django, Pydantic, Rails, Laravel
  { cat: 'validator', re: /(?<!Math)\.(min|max|length|gte|lte|gt|lt|positive|negative|nonnegative|int|integer|email|url|uuid|regex|matches|required|nonempty)\(\s*([^)]{0,60})\)/g, label: (m) => `.${m[1]}(${m[2].trim()})`, needs: /\b(?:z\.(?:object|string|number|array)|yup\.|Joi\.|joi\.|from ['"](?:zod|yup|joi|valibot|class-validator)['"]|require\(['"](?:zod|yup|joi)['"]\))/ },
  { cat: 'validator', re: /@(Size|Min|Max|NotNull|NotBlank|NotEmpty|Email|Pattern|Positive|PositiveOrZero|Negative|Past|Future|DecimalMin|DecimalMax|Length|IsEmail|IsNotEmpty|MinLength|MaxLength|IsInt|IsPositive|Matches)\b\s*(\([^)]{0,80}\))?/g, label: (m) => `@${m[1]}${m[2] || ''}` },
  { cat: 'validator', re: /\[(Required|StringLength|Range|MaxLength|MinLength|EmailAddress|RegularExpression|Phone|Url|Compare)\b\s*(\([^\]]{0,80}\))?\]/g, label: (m) => `[${m[1]}${m[2] || ''}]` },
  { cat: 'validator', re: /\b(max_length|min_length|max_value|min_value|max_digits|decimal_places|ge|le|gt|lt)\s*=\s*([\w.]+)/g, label: (m) => `${m[1]}=${m[2]}`, needs: /(Field|models\.|forms\.|serializers\.|conint|constr|condecimal|Column)/ },
  { cat: 'validator', re: /\bvalidates?\s+:?\w+.*?(presence|length|numericality|format|uniqueness|inclusion)\b/g, label: (m) => m[0].slice(0, 100) },
  { cat: 'validator', re: /['"](required|nullable|email|numeric|integer|min:\d+|max:\d+|between:\d+,\d+|size:\d+|regex:[^'"]+)(\|[^'"]*)?['"]/g, label: (m) => m[0].slice(1, -1), needs: /\bvalidate|rules\b/ },
  // Numeric boundaries in code
  { cat: 'boundary', re: /\b([A-Za-z_][\w.]*(?:length|Length|count|Count|size|Size|qty|Qty|quantity|Quantity|amount|Amount|total|Total|age|Age|price|Price|level|Level|limit|Limit|max|Max|min|Min|coins|Coins|stock|Stock|balance|Balance|attempts|Attempts|retries|Retries))\s*(>=|<=|>|<|===|==)\s*(-?\d+(?:\.\d+)?)/g, label: (m) => `${m[1]} ${m[2]} ${m[3]}` },
  { cat: 'boundary', re: /\b((?:MAX|MIN|LIMIT|MAXIMUM|MINIMUM)_[A-Z0-9_]+|[A-Z0-9_]+_(?:MAX|MIN|LIMIT))\s*[:=]\s*(-?\d+(?:\.\d+)?)/g, label: (m) => `${m[1]} = ${m[2]}` },
  // Error and validation messages shown to users
  { cat: 'message', re: /(["'`])((?:(?!\1).){0,80}?\b(?:required|invalid|must be|must have|cannot|can't|not allowed|too long|too short|too many|too few|at least|at most|exceeds?|insufficient|not enough|expired|locked|already (?:exists|taken|used|registered)|not found|do not match|does not match|incorrect|wrong|failed|unavailable|out of stock|limit reached|maximum|minimum)\b(?:(?!\1).){0,80})\1/gi, label: (m) => m[2],
    // A message has at least two words and is not HTML or a CSS class list.
    keep: (m) => /[A-Za-z]{2,}\s+[A-Za-z!]/.test(m[2]) && !/[<>]|class=|^[\w-]+(\s+[\w-]+)*$/.test(m[2].replace(/\$\{[^}]*\}/g, 'x').trim()) || /\s/.test(m[2]) && /[.!:)]$/.test(m[2].trim()) },
  // States and statuses
  { cat: 'state', re: /\b(status|state|phase|stage|step|mode)\s*(?:===?|!==?|==|:)\s*["'](\w[\w-]{1,30})["']/gi, label: (m) => `${m[1]} = ${m[2]}` },
  { cat: 'state', re: /\benum\s+(\w+)\s*\{([^}]{1,200})\}/g, label: (m) => `enum ${m[1]} { ${m[2].replace(/\s+/g, ' ').trim()} }` },
  // API routes
  { cat: 'route', re: /\b(?:app|router|api|server|route|r)\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/gi, label: (m) => `${m[1].toUpperCase()} ${m[2]}` },
  { cat: 'route', re: /@(Get|Post|Put|Patch|Delete|Request)Mapping\(\s*(?:value\s*=\s*)?["']([^"']+)["']/g, label: (m) => `${m[1].toUpperCase()} ${m[2]}` },
  { cat: 'route', re: /\[(?:Http(Get|Post|Put|Patch|Delete)|Route)\(\s*"([^"]+)"/g, label: (m) => `${(m[1] || 'ROUTE').toUpperCase()} ${m[2]}` },
  { cat: 'route', re: /\b(?:path|re_path|url)\(\s*r?["']([^"']+)["']/g, label: (m) => `ROUTE ${m[1]}`, needs: /urlpatterns|from django/ },
  { cat: 'route', re: /\bfetch\(\s*["'`]([^"'`]+)["'`]/g, label: (m) => `CALL ${m[1]}` },
  // Permissions and roles
  { cat: 'permission', re: /\b(isAdmin|is_admin|hasRole|has_role|hasPermission|can\(|authorize|requireAuth|login_required|@PreAuthorize|\[Authorize|isLoggedIn|isAuthenticated|role\s*===?\s*["']\w+["'])/g, label: (m) => m[1] },
  // Feature flags and debug switches
  { cat: 'flag', re: /\b(feature[_-]?flag|featureFlags?|isEnabled\(|FEATURE_[A-Z_]+|DEBUG\b|debugMode|isDebug|cheat)/g, label: (m) => m[1] },
];

const CATEGORY_TITLES = {
  'input-limit': 'Input limits in HTML or components (boundary-value cases)',
  validator: 'Validators (equivalence partitions and boundaries)',
  boundary: 'Numeric limits in code (boundary-value cases)',
  message: 'Messages shown on errors (expected results for negative cases)',
  state: 'States and statuses (state-transition cases)',
  route: 'Routes and API calls (features and API cases)',
  permission: 'Permissions and roles (negative cases: who must not get in)',
  flag: 'Feature flags and debug switches (configurations to cover or exclude)',
};

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
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

const hits = [];
let filesScanned = 0;
for (const file of walk(ROOT)) {
  const r = rel(file);
  if (!EXT.has(path.extname(file).toLowerCase())) continue;
  if (excludes.some((x) => r.includes(x))) continue;
  if (/\.min\.(js|css)$|package-lock\.json$|yarn\.lock$|\.map$/.test(r)) continue;
  let stat;
  try { stat = fs.statSync(file); } catch { continue; }
  if (stat.size > MAX_BYTES) continue;
  const text = fs.readFileSync(file, 'utf8');
  filesScanned++;
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.length > 2000) return; // minified or generated
    const trimmed = line.trim();
    if (/^(\/\/|#|\*|\/\*|<!--)/.test(trimmed)) return; // comments
    for (const rule of RULES) {
      if (rule.needs && !rule.needs.test(text)) continue;
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(line))) {
        if (rule.keep && !rule.keep(m)) continue;
        hits.push({ category: rule.cat, rule: rule.label(m), file: r, line: i + 1, code: trimmed.slice(0, 160) });
        if (!rule.re.global) break;
      }
    }
  });
}

// Drop exact duplicates (same file, line and rule).
const seen = new Set();
const unique = hits.filter((h) => { const k = `${h.file}:${h.line}:${h.rule}`; if (seen.has(k)) return false; seen.add(k); return true; });

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'rules.json'), JSON.stringify({ root: path.basename(ROOT), filesScanned, total: unique.length, hits: unique }, null, 2));

let md = `# Rules found in code\n\nScanned ${filesScanned} files under \`${path.basename(ROOT)}\`. ${unique.length} possible rules. The scan is generous: check each one in the code before you turn it into a case.\n\n`;
md += `| Category | Matches |\n|---|---|\n${Object.keys(CATEGORY_TITLES).map((c) => `| ${c} | ${unique.filter((h) => h.category === c).length} |`).join('\n')}\n\n`;
for (const [cat, title] of Object.entries(CATEGORY_TITLES)) {
  const list = unique.filter((h) => h.category === cat);
  if (!list.length) continue;
  md += `## ${title}\n\n| Rule | Where | Code |\n|---|---|---|\n`;
  for (const h of list.slice(0, 300)) md += `| ${h.rule.replace(/\|/g, '\\|').slice(0, 100)} | ${h.file}:${h.line} | \`${h.code.replace(/\|/g, '\\|').replace(/`/g, "'").slice(0, 110)}\` |\n`;
  if (list.length > 300) md += `\n${list.length - 300} more in rules.json.\n`;
  md += '\n';
}
fs.writeFileSync(path.join(OUT, 'rules.md'), md);
console.log(`Scanned ${filesScanned} files: ${unique.length} possible rules.`);
for (const c of Object.keys(CATEGORY_TITLES)) console.log(`  ${c.padEnd(12)} ${unique.filter((h) => h.category === c).length}`);
console.log(`Wrote ${path.join(OUT, 'rules.md')}`);
