// Enforces spec §4 performance budgets on a production build (needs build.manifest: true).
//   - App shell (everything index.html loads up front): <= 150 KB gzipped JS
//   - Each non-Heavy Tool: <= 100 KB gzipped of code only that Tool loads (shared chunks such as the editor are reported separately)
// Usage: node scripts/check-budgets.mjs [distDir]
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const manifest = JSON.parse(readFileSync(join(dist, '.vite/manifest.json'), 'utf8'));
const SHELL_KB = 150;
const TOOL_KB = 100;

const gz = new Map();
const size = (file) => {
  if (!gz.has(file)) gz.set(file, gzipSync(readFileSync(join(dist, file))).length);
  return gz.get(file);
};
const kb = (n) => (n / 1024).toFixed(1);

/** Static import closure of a manifest entry (JS files only). */
function closure(key, seen = new Set()) {
  const entry = manifest[key];
  if (!entry || seen.has(entry.file)) return seen;
  seen.add(entry.file);
  for (const imp of entry.imports ?? []) closure(imp, seen);
  return seen;
}

const shellKey = Object.keys(manifest).find((k) => manifest[k].isEntry && k.endsWith('index.html'));
const shell = closure(shellKey);
const shellSize = [...shell].filter((f) => f.endsWith('.js')).reduce((n, f) => n + size(f), 0);

// Heavy Tools are exempt; read their ids from the meta files compiled into the shell.
const toolKeys = Object.keys(manifest).filter((k) => /tools\/[^/]+\/[^/]+\/Tool\.tsx$/.test(k));
const heavyPaths = new Set();
for (const k of toolKeys) {
  const metaSrc = readFileSync(join('..', '..', 'packages', 'tools', k.replace(/^.*packages\/tools\//, ''), '..', 'meta.ts'), 'utf8');
  if (/heavy:\s*true/.test(metaSrc)) heavyPaths.add(k);
}

const closures = new Map(toolKeys.map((k) => [k, [...closure(k)].filter((f) => f.endsWith('.js') && !shell.has(f))]));
const usage = new Map();
for (const files of closures.values()) for (const f of files) usage.set(f, (usage.get(f) ?? 0) + 1);

let failed = false;
console.log(`App shell: ${kb(shellSize)} KB gzipped (budget ${SHELL_KB} KB)`);
if (shellSize > SHELL_KB * 1024) {
  failed = true;
  console.error(`  ✗ App shell over budget`);
}

const rows = [];
for (const [k, files] of closures) {
  const own = files.filter((f) => usage.get(f) === 1).reduce((n, f) => n + size(f), 0);
  const name = k.replace(/^.*tools\/src\/tools\//, '').replace(/\/Tool\.tsx$/, '');
  const heavy = heavyPaths.has(k);
  const over = !heavy && own > TOOL_KB * 1024;
  if (over) failed = true;
  rows.push({ name, own, heavy, over });
}
rows.sort((a, b) => b.own - a.own);
console.log(`\nTools (own code, gzipped; budget ${TOOL_KB} KB, Heavy Tools exempt):`);
for (const r of rows.slice(0, 15)) console.log(`  ${r.over ? '✗' : '✓'} ${r.name.padEnd(28)} ${kb(r.own).padStart(7)} KB${r.heavy ? '  (heavy)' : ''}`);
if (rows.length > 15) console.log(`  … ${rows.length - 15} more, all smaller`);

const shared = [...usage].filter(([, n]) => n > 1).map(([f, n]) => ({ f, n, s: size(f) })).sort((a, b) => b.s - a.s);
console.log('\nShared chunks (loaded by several Tools, cached once):');
for (const c of shared.slice(0, 8)) console.log(`  ${c.f.padEnd(40)} ${kb(c.s).padStart(7)} KB  used by ${c.n} Tools`);

if (failed) {
  console.error('\nPerformance budget exceeded (spec §4).');
  process.exit(1);
}
console.log('\nAll performance budgets met.');
