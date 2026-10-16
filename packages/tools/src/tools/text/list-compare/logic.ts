export type SetOp = 'union' | 'intersection' | 'a-only' | 'b-only' | 'symmetric';

export interface CompareOptions {
  op: SetOp;
  trim: boolean;
  ignoreCase: boolean;
}

export interface CompareResult {
  items: string[];
  counts: { a: number; b: number; both: number; aOnly: number; bOnly: number; union: number };
}

function parse(input: string, o: CompareOptions): Map<string, string> {
  const map = new Map<string, string>();
  for (const raw of input.split(/\r?\n/)) {
    const line = o.trim ? raw.trim() : raw;
    if (line === '') continue;
    const key = o.ignoreCase ? line.toLowerCase() : line;
    if (!map.has(key)) map.set(key, line);
  }
  return map;
}

export function compareLists(a: string, b: string, o: CompareOptions): CompareResult {
  const A = parse(a, o);
  const B = parse(b, o);
  const aOnly = [...A].filter(([k]) => !B.has(k)).map(([, v]) => v);
  const bOnly = [...B].filter(([k]) => !A.has(k)).map(([, v]) => v);
  const both = [...A].filter(([k]) => B.has(k)).map(([, v]) => v);
  const union = [...A.values(), ...bOnly];
  const items = o.op === 'union' ? union : o.op === 'intersection' ? both : o.op === 'a-only' ? aOnly : o.op === 'b-only' ? bOnly : [...aOnly, ...bOnly];
  return { items, counts: { a: A.size, b: B.size, both: both.length, aOnly: aOnly.length, bOnly: bOnly.length, union: union.length } };
}

export function compareLists_text(a: string, b: string, o: CompareOptions): string {
  return compareLists(a, b, o).items.join('\n');
}
