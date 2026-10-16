import Papa from 'papaparse';
import { ToolError } from '@/core/types';
import { parseJson } from '../format/logic';

export type Delimiter = ',' | ';' | '\t' | '|';

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Flatten nested objects into dotted keys; arrays and other values become cell values. */
export function flatten(value: unknown, prefix = '', out: Obj = {}): Obj {
  if (isObj(value)) {
    const keys = Object.keys(value);
    if (!keys.length && prefix) out[prefix] = '{}';
    for (const k of keys) flatten(value[k], prefix ? `${prefix}.${k}` : k, out);
  } else {
    out[prefix || 'value'] = value;
  }
  return out;
}

function cell(v: unknown): string | number | boolean {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return v as string | number | boolean;
}

export function jsonToCsv(input: string, delimiter: Delimiter, flattenObjects = true): string {
  const data = parseJson(input);
  const rows: unknown[] = Array.isArray(data) ? data : [data];
  if (!rows.length) throw new ToolError('The JSON array is empty, so there is nothing to convert.');
  if (rows.every(Array.isArray)) {
    return Papa.unparse(
      (rows as unknown[][]).map((r) => r.map(cell)),
      { delimiter, newline: '\n' },
    );
  }
  const flat = rows.map((r) => (isObj(r) ? (flattenObjects ? flatten(r) : r) : { value: r }));
  const fields: string[] = [];
  const seen = new Set<string>();
  for (const r of flat) {
    for (const k of Object.keys(r)) {
      if (!seen.has(k)) {
        seen.add(k);
        fields.push(k);
      }
    }
  }
  return Papa.unparse({ fields, data: flat.map((r) => fields.map((f) => cell(r[f]))) }, { delimiter, newline: '\n' });
}

function setDeep(target: Obj, path: string[], value: unknown) {
  let cur = target;
  path.forEach((p, i) => {
    if (i === path.length - 1) cur[p] = value;
    else {
      if (!isObj(cur[p])) cur[p] = {};
      cur = cur[p] as Obj;
    }
  });
}

export function csvToJson(input: string, delimiter: Delimiter | 'auto', opts: { types: boolean; unflatten: boolean }): string {
  const res = Papa.parse<Obj>(input, { header: true, skipEmptyLines: true, dynamicTyping: opts.types, ...(delimiter === 'auto' ? {} : { delimiter }) });
  const fatal = res.errors.find((e) => e.type !== 'Delimiter');
  if (fatal) throw new ToolError(`CSV problem${fatal.row !== undefined ? ` on row ${fatal.row + 2}` : ''}: ${fatal.message}`);
  let data: Obj[] = res.data;
  if (opts.unflatten) {
    data = data.map((r) => {
      const o: Obj = {};
      for (const [k, v] of Object.entries(r)) setDeep(o, k.split('.'), v);
      return o;
    });
  }
  return JSON.stringify(data, null, 2);
}
