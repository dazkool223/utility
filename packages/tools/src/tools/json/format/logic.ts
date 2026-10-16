import { ToolError } from '@/core/types';

export type Indent = '2' | '4' | 'tab';

export interface FormatOptions {
  indent: Indent;
  sortKeys: boolean;
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortDeep((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

/** Line and column (1-based) of a character offset. */
export function lineCol(text: string, offset: number): { line: number; column: number } {
  const before = text.slice(0, offset);
  const line = before.split('\n').length;
  return { line, column: offset - before.lastIndexOf('\n') };
}

/** Parse JSON, turning engine-specific errors into "line X, column Y: …". */
export function parseJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // V8: "... at position 12 (line 2 column 3)"; Firefox: "... at line 2 column 3 of the JSON data"
    const lc = /line (\d+) column (\d+)/.exec(msg);
    const pos = /position (\d+)/.exec(msg);
    const where = lc ? { line: Number(lc[1]), column: Number(lc[2]) } : pos ? lineCol(input, Number(pos[1])) : null;
    const reason = msg.replace(/^JSON\.parse: /, '').replace(/ in JSON at position.*$| at line \d+ column \d+.*$/, '');
    throw new ToolError(where ? `Invalid JSON at line ${where.line}, column ${where.column}: ${reason}` : `Invalid JSON: ${reason}`);
  }
}

export function formatJson(input: string, { indent, sortKeys }: FormatOptions): string {
  const value = parseJson(input);
  return JSON.stringify(sortKeys ? sortDeep(value) : value, null, indent === 'tab' ? '\t' : Number(indent));
}
