import { ToolError } from '@/core/types';
import { parseJson } from '../format/logic';

function depthOf(v: unknown): number {
  if (v && typeof v === 'object') {
    let max = 0;
    for (const c of Object.values(v)) max = Math.max(max, depthOf(c));
    return max + 1;
  }
  return 0;
}

function typeOf(v: unknown): string {
  return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
}

/** Validate JSON. Returns a short report; throws a ToolError with line, column and a code excerpt when invalid. */
export function validateJson(input: string): string {
  try {
    const value = parseJson(input);
    const t = typeOf(value);
    const lines = ['Valid JSON', `Type: ${t}`];
    if (t === 'array') lines.push(`Items: ${(value as unknown[]).length}`);
    if (t === 'object') lines.push(`Keys: ${Object.keys(value as object).length}`);
    lines.push(`Depth: ${depthOf(value)}`, `Size: ${new TextEncoder().encode(input).length} bytes`);
    return lines.join('\n');
  } catch (e) {
    if (!(e instanceof ToolError)) throw e;
    const m = /line (\d+), column (\d+)/.exec(e.message);
    if (!m) throw e;
    const line = Number(m[1]);
    const col = Number(m[2]);
    const src = input.split('\n')[line - 1] ?? '';
    const start = Math.max(0, col - 40);
    const excerpt = src.slice(start, col + 40);
    throw new ToolError(`${e.message}\n\n${line} | ${excerpt}\n${' '.repeat(String(line).length + 3 + col - 1 - start)}^`);
  }
}
