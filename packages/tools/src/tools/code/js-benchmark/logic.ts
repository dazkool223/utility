import { ToolError } from '@/core/types';

export interface BenchOptions {
  /** Time spent measuring each case, in milliseconds. */
  timeMs: number;
  /** Warm-up time per case, in milliseconds. */
  warmupMs: number;
  /** Snippets use await (the generated runner awaits every call). */
  async: boolean;
}

export const DEFAULT_BENCH: BenchOptions = { timeMs: 1000, warmupMs: 200, async: false };

export interface BenchCase {
  name: string;
  code: string;
  /** True when the snippet is a single expression whose value is returned. */
  expression: boolean;
}

export interface BenchSpec {
  setup: string;
  cases: BenchCase[];
}

const SEPARATOR = /^[ \t]*\/\/[ \t]*-{3,}[ \t]*$/m;
const STATEMENT_START = /^(const|let|var|for|while|if|do|function|class|return|throw|try|switch|import|export|async\s+function|await\b.*;)/;

/**
 * Snippets are separated by a `// ---` line. An optional first block starting with `// setup` runs once.
 * A case may start with `// name: My case`. A case that is one line, has no `;` and does not start with a
 * statement keyword is treated as an expression and returned.
 */
export function parseBenchSpec(input: string): BenchSpec {
  if (!input.trim()) throw new ToolError('Enter at least one code snippet to benchmark. Separate several snippets with a line containing // ---');
  const blocks = input.split(SEPARATOR).map((b) => b.replace(/^\s*\n|\s+$/g, ''));
  let setup = '';
  const cases: BenchCase[] = [];
  blocks.forEach((raw, i) => {
    let block = raw;
    if (!block.trim()) {
      if (blocks.length > 1) throw new ToolError(`Snippet ${i + 1} is empty. Remove the extra // --- line or add code.`);
      return;
    }
    if (/^\/\/[ \t]*setup\b/i.test(block) && cases.length === 0 && !setup) {
      setup = block.replace(/^\/\/[ \t]*setup[^\n]*\n?/i, '').trimEnd();
      return;
    }
    let name = `Case ${cases.length + 1}`;
    const m = /^\/\/[ \t]*name:[ \t]*(.+)\n?/i.exec(block);
    if (m) {
      name = m[1]!.trim();
      block = block.slice(m[0].length).trim();
    }
    if (!block) throw new ToolError(`The snippet "${name}" has no code.`);
    const oneLine = !block.includes('\n');
    const expression = oneLine && !block.replace(/\/\/.*$/, '').trim().endsWith(';') && !STATEMENT_START.test(block) && !block.includes(';');
    cases.push({ name, code: block, expression });
  });
  if (!cases.length) throw new ToolError('Only a setup block was found. Add at least one snippet to benchmark after a // --- line.');
  return { setup, cases };
}

const q = (s: string) => JSON.stringify(s);
const indent = (code: string, pad: string) => code.split('\n').map((l) => (l ? pad + l : l)).join('\n');

/** A standalone script that runs in Node, Deno, Bun or a browser console and prints operations per second. */
export function buildBenchmark(input: string, o: BenchOptions = DEFAULT_BENCH): string {
  if (!(o.timeMs >= 50)) throw new ToolError('Measuring time must be at least 50 ms.');
  if (!(o.warmupMs >= 0)) throw new ToolError('Warm-up time cannot be negative.');
  const spec = parseBenchSpec(input);
  const aw = o.async ? 'await ' : '';
  const fnKw = o.async ? 'async ' : '';
  const lines: string[] = [];
  lines.push(`// Benchmark: ${spec.cases.length} case${spec.cases.length === 1 ? '' : 's'}, ${o.timeMs} ms each after ${o.warmupMs} ms warm-up.`);
  lines.push('// Paste into a browser console, or save as bench.mjs and run with node, deno or bun.');
  lines.push('');
  if (spec.setup) lines.push('// Setup (runs once)', spec.setup, '');
  lines.push('const cases = [');
  for (const c of spec.cases) {
    lines.push(`  {`, `    name: ${q(c.name)},`, `    fn: ${fnKw}() => {`, c.expression ? `      return (${c.code});` : indent(c.code, '      '), `    },`, `  },`);
  }
  lines.push('];', '');
  lines.push(
    `const TIME_MS = ${o.timeMs};`,
    `const WARMUP_MS = ${o.warmupMs};`,
    'const SAMPLES = 5;',
    '',
    'let sink; // keeps results alive so the engine cannot skip the work',
    '',
    `async function timeLoop(fn, ms) {`,
    '  let iterations = 0;',
    '  const start = performance.now();',
    '  let now = start;',
    '  while (now - start < ms) {',
    `    for (let i = 0; i < 16; i++) sink = ${aw}fn();`,
    '    iterations += 16;',
    '    now = performance.now();',
    '  }',
    '  return { iterations, seconds: (now - start) / 1000 };',
    '}',
    '',
    'const results = [];',
    'for (const c of cases) {',
    '  await timeLoop(c.fn, WARMUP_MS);',
    '  const rates = [];',
    '  for (let s = 0; s < SAMPLES; s++) {',
    '    const { iterations, seconds } = await timeLoop(c.fn, TIME_MS / SAMPLES);',
    '    rates.push(iterations / seconds);',
    '  }',
    '  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;',
    '  const sd = Math.sqrt(rates.reduce((a, b) => a + (b - mean) ** 2, 0) / rates.length);',
    '  results.push({ name: c.name, mean, rme: mean ? (sd / mean) * 100 : 0 });',
    '}',
    '',
    'const fastest = Math.max(...results.map((r) => r.mean));',
    'for (const r of results) {',
    '  const ops = Math.round(r.mean).toLocaleString("en-US");',
    '  const tag = r.mean === fastest ? "fastest" : `${((r.mean / fastest) * 100).toFixed(1)}% of fastest`;',
    '  console.log(`${r.name}: ${ops} ops/sec ±${r.rme.toFixed(2)}% (${tag})`);',
    '}',
    'if (sink === Symbol.for("never")) console.log(sink);',
  );
  return lines.join('\n');
}
