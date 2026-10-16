import { describe, expect, it } from 'vitest';
import { buildBenchmark, DEFAULT_BENCH, parseBenchSpec } from './logic';

const SPEC = `// setup
const arr = Array.from({ length: 100 }, (_, i) => i);
// ---
// name: for loop
let s = 0;
for (let i = 0; i < arr.length; i++) s += arr[i];
// ---
// name: reduce
arr.reduce((a, b) => a + b, 0)`;

describe('parseBenchSpec', () => {
  it('splits setup and named cases', () => {
    const spec = parseBenchSpec(SPEC);
    expect(spec.setup).toBe('const arr = Array.from({ length: 100 }, (_, i) => i);');
    expect(spec.cases.map((c) => c.name)).toEqual(['for loop', 'reduce']);
    expect(spec.cases[0]!.expression).toBe(false);
    expect(spec.cases[1]!.expression).toBe(true);
  });
  it('names cases automatically and detects expressions', () => {
    const spec = parseBenchSpec('Math.max(1, 2)\n// ---\nconst x = 1;\n// ---\nfoo(); // call');
    expect(spec.cases.map((c) => [c.name, c.expression])).toEqual([
      ['Case 1', true],
      ['Case 2', false],
      ['Case 3', false],
    ]);
  });
  it('accepts a single snippet', () => {
    expect(parseBenchSpec('[1,2,3].map(x => x * 2)').cases).toHaveLength(1);
  });
  it('rejects bad specs', () => {
    expect(() => parseBenchSpec('')).toThrow('at least one');
    expect(() => parseBenchSpec('// setup\nconst a = 1;')).toThrow('Only a setup block');
    expect(() => parseBenchSpec('a()\n// ---\n\n// ---\nb()')).toThrow('Snippet 2 is empty');
    expect(() => parseBenchSpec('// name: x\n// ---\nb()')).toThrow('no code');
  });
});

describe('buildBenchmark', () => {
  it('generates a script with every case and the settings', () => {
    const out = buildBenchmark(SPEC, { ...DEFAULT_BENCH, timeMs: 500, warmupMs: 50 });
    expect(out).toContain('const arr = Array.from');
    expect(out).toContain('name: "for loop"');
    expect(out).toContain('return (arr.reduce((a, b) => a + b, 0));');
    expect(out).toContain('const TIME_MS = 500;');
    expect(out).toContain('const WARMUP_MS = 50;');
    expect(out).toContain('ops/sec');
  });
  it('produces valid, runnable JavaScript', async () => {
    const out = buildBenchmark('// name: a\n1 + 1\n// ---\n// name: b\nlet t = 0; for (let i = 0; i < 10; i++) t += i;', { timeMs: 50, warmupMs: 0, async: false });
    const logs: string[] = [];
    const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (...a: string[]) => (...a: unknown[]) => Promise<void>;
    await new AsyncFunction('console', 'performance', out)({ log: (s: string) => logs.push(s) }, performance);
    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatch(/^a: [\d,]+ ops\/sec ±[\d.]+% \(/);
  });
  it('supports async snippets', async () => {
    const out = buildBenchmark('await Promise.resolve(1)', { timeMs: 50, warmupMs: 0, async: true });
    expect(out).toContain('fn: async () => {');
    expect(out).toContain('sink = await fn();');
    const logs: string[] = [];
    const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (...a: string[]) => (...a: unknown[]) => Promise<void>;
    await new AsyncFunction('console', 'performance', out)({ log: (s: string) => logs.push(s) }, performance);
    expect(logs).toHaveLength(1);
  });
  it('keeps unicode in names', () => {
    expect(buildBenchmark('// name: héllo 日本\nx()')).toContain('"héllo 日本"');
  });
  it('validates settings', () => {
    expect(() => buildBenchmark('a()', { ...DEFAULT_BENCH, timeMs: 5 })).toThrow('at least 50');
    expect(() => buildBenchmark('a()', { ...DEFAULT_BENCH, warmupMs: -1 })).toThrow('negative');
  });
});
