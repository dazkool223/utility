import { parse, stringify } from 'smol-toml';
import { ToolError } from '@/core/types';
import { parseJson } from '../../json/format/logic';

export function parseToml(input: string): Record<string, unknown> {
  try {
    return parse(input);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const { line, column } = e as { line?: number; column?: number };
    const first = msg.split('\n')[0]!;
    throw new ToolError(line ? `${first} (line ${line}, column ${column ?? 1})` : first);
  }
}

function findNull(v: unknown, path: string): string | null {
  if (v === null) return path;
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) {
      const r = findNull(v[i], `${path}[${i}]`);
      if (r) return r;
    }
  } else if (v && typeof v === 'object') {
    for (const [k, c] of Object.entries(v)) {
      const r = findNull(c, `${path}.${k}`);
      if (r) return r;
    }
  }
  return null;
}

/** Throws a ToolError when the value cannot be written as TOML (root not a table, or null somewhere). */
export function stringifyToml(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ToolError('TOML needs an object at the top level (key = value pairs), not an array or a single value.');
  const nul = findNull(value, '$');
  if (nul) throw new ToolError(`TOML has no null value. Remove or replace the null at ${nul}.`);
  return stringify(value).trimEnd();
}

export function tomlToJson(input: string, indent = 2): string {
  return JSON.stringify(parseToml(input), null, indent);
}

export function jsonToToml(input: string): string {
  return stringifyToml(parseJson(input));
}
