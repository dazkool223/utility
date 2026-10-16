import { ToolError } from '@/core/types';

export type NumberKind = 'number' | 'BigNumber' | 'Fraction';

type MathInstance = import('mathjs').MathJsInstance;
const instances = new Map<NumberKind, MathInstance>();

async function getMath(kind: NumberKind): Promise<MathInstance> {
  const cached = instances.get(kind);
  if (cached) return cached;
  const { create, all } = await import('mathjs');
  const math = create(all!, { number: kind, precision: 64 });
  // Expressions are evaluated by mathjs' own parser (never eval). Block the functions that change the engine itself.
  const blocked = () => {
    throw new Error('This function is disabled in the calculator.');
  };
  math.import({ import: blocked, createUnit: blocked, ...sizeGuards(math) }, { override: true });
  instances.set(kind, math);
  return math;
}

/** Largest number of values a matrix or range may hold. Bigger ones would exhaust the browser's memory. */
export const MAX_VALUES = 1_000_000;

function tooBig(): never {
  throw new Error(`That would create more than ${MAX_VALUES.toLocaleString('en-US')} values, which is too large for the calculator.`);
}

const asNumber = (v: unknown): number => {
  const n = Number((v as { valueOf(): unknown } | null)?.valueOf() ?? v);
  return Number.isFinite(n) ? n : Infinity;
};

/** Number of values in a matrix of the given dimensions, e.g. [3, 4] -> 12. */
function cellsOf(dims: unknown): number {
  const list = Array.isArray(dims) ? dims : dims && typeof (dims as { toArray?: unknown }).toArray === 'function' ? (dims as { toArray(): unknown[] }).toArray() : [dims];
  return list.reduce<number>((n, d) => n * Math.abs(asNumber(d)), 1);
}

/**
 * Wraps the functions that allocate memory in proportion to their arguments (zeros(1e5, 1e5), range(1, 1e9), ...)
 * so a typed or pasted expression cannot run the browser out of memory. Everything else is limited by the Tool's timeout.
 */
function sizeGuards(math: MathInstance) {
  const m = math as unknown as Record<string, (...a: unknown[]) => unknown>;
  const sizeOf = (v: unknown) => cellsOf(m.size!(v));
  const dimsArg = (a: unknown[]) => (a.length === 1 ? a[0] : a);
  const guard = (name: string, count: (a: unknown[]) => number) => {
    const original = m[name]!;
    return (...a: unknown[]) => {
      if (count(a) > MAX_VALUES) tooBig();
      return original(...a);
    };
  };
  return {
    zeros: guard('zeros', (a) => cellsOf(dimsArg(a))),
    ones: guard('ones', (a) => cellsOf(dimsArg(a))),
    identity: guard('identity', (a) => (a.length === 1 && !Array.isArray(a[0]) && typeof a[0] !== 'object' ? asNumber(a[0]) ** 2 : cellsOf(dimsArg(a)))),
    resize: guard('resize', (a) => cellsOf(a[1])),
    diag: guard('diag', (a) => (a.length ? asNumber(m.size!(a[0])) : 0) ** 2),
    kron: guard('kron', (a) => (a.length === 2 ? sizeOf(a[0]) * sizeOf(a[1]) : 0)),
    outer: guard('outer', (a) => (a.length === 2 ? sizeOf(a[0]) * sizeOf(a[1]) : 0)),
    randomInt: guard('randomInt', (a) => a.filter((x) => typeof x === 'object').reduce<number>((n, x) => n * cellsOf(x), 1)),
    random: guard('random', (a) => a.filter((x) => typeof x === 'object').reduce<number>((n, x) => n * cellsOf(x), 1)),
    range: guard('range', (a) => rangeLength(a.filter((x) => typeof x !== 'boolean'))),
  };
}

/** Count of values in range(start, end, step) or range("start:step:end"); Infinity when it cannot be worked out. */
function rangeLength(a: unknown[]): number {
  let start: number, end: number, step = 1;
  if (typeof a[0] === 'string') {
    const p = a[0].split(':').map(Number);
    [start, end, step] = p.length === 3 ? [p[0]!, p[2]!, p[1]!] : [p[0]!, p[1]!, 1];
  } else {
    start = asNumber(a[0]);
    end = asNumber(a[1]);
    if (a.length > 2) step = asNumber(a[2]);
  }
  const n = Math.abs((end - start) / (step || 1));
  return Number.isNaN(n) ? Infinity : n;
}

export interface EvalLine {
  expression: string;
  result: string;
}

function plainError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  return m.replace(/\s*\(char \d+\)$/, '').replace(/^Error: /, '');
}

/** Evaluates each line in turn with a shared scope, so `x = 5` then `x * 2` works. Lines starting with # are comments. */
export async function evaluateLines(input: string, kind: NumberKind = 'number', precision = 14): Promise<EvalLine[]> {
  const math = await getMath(kind);
  const scope = new Map<string, unknown>();
  const out: EvalLine[] = [];
  const lines = input.split('\n');
  if (!lines.some((l) => l.trim() && !l.trim().startsWith('#'))) throw new ToolError('Enter an expression, such as 2 * (3 + 4) or sqrt(16) + 5 inch to cm.');
  lines.forEach((raw, i) => {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) return;
    try {
      const r = math.evaluate(line, scope);
      out.push({ expression: line, result: format(math, r, precision) });
    } catch (e) {
      throw new ToolError(`Line ${i + 1} ("${line}"): ${plainError(e)}`);
    }
  });
  return out;
}

function format(math: MathInstance, r: unknown, precision: number): string {
  if (r === undefined) return '';
  if (typeof r === 'function') return 'function';
  // ResultSet from multi-statement lines
  if (r && typeof r === 'object' && 'entries' in r && Array.isArray((r as { entries: unknown[] }).entries)) {
    return (r as { entries: unknown[] }).entries.map((x) => format(math, x, precision)).filter(Boolean).join('; ');
  }
  return math.format(r as never, { precision, lowerExp: -9, upperExp: 21 });
}

export async function evaluateText(input: string, kind: NumberKind = 'number', precision = 14): Promise<string> {
  return (await evaluateLines(input, kind, precision)).map((l) => `${l.expression} = ${l.result}`).join('\n');
}
