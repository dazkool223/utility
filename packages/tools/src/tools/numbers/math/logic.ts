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
  math.import({ import: blocked, createUnit: blocked }, { override: true });
  instances.set(kind, math);
  return math;
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
