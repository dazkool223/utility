import { shuffled } from '../_lib/random';

export type LineOp = 'sort' | 'dedupe' | 'reverse' | 'shuffle' | 'trim' | 'remove-empty';

export interface LineOptions {
  op: LineOp;
  descending: boolean;
  ignoreCase: boolean;
  /** Natural / numeric ordering: "file2" before "file10". */
  natural: boolean;
  byLength: boolean;
}

export const DEFAULT_LINE_OPTIONS: LineOptions = { op: 'sort', descending: false, ignoreCase: false, natural: false, byLength: false };

/** Split on \n or \r\n, ignoring one trailing newline so "a\nb\n" has two lines. */
export function splitLines(input: string): { lines: string[]; trailingNewline: boolean } {
  const trailingNewline = /\r?\n$/.test(input);
  const lines = input.replace(/\r?\n$/, '').split(/\r?\n/);
  return { lines: input === '' ? [] : lines, trailingNewline };
}

export function applyLineOp(input: string, o: LineOptions, rand?: (max: number) => number): string {
  const { lines, trailingNewline } = splitLines(input);
  let out: string[];
  const key = (s: string) => (o.ignoreCase ? s.toLowerCase() : s);
  switch (o.op) {
    case 'sort': {
      const collator = new Intl.Collator(undefined, { numeric: o.natural, sensitivity: o.ignoreCase ? 'accent' : 'variant' });
      const cmp = o.byLength ? (a: string, b: string) => a.length - b.length || collator.compare(a, b) : (a: string, b: string) => (o.natural || o.ignoreCase ? collator.compare(a, b) : a < b ? -1 : a > b ? 1 : 0);
      out = [...lines].sort(cmp);
      if (o.descending) out.reverse();
      break;
    }
    case 'dedupe': {
      const seen = new Set<string>();
      out = lines.filter((l) => {
        const k = key(l);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      break;
    }
    case 'reverse':
      out = [...lines].reverse();
      break;
    case 'shuffle':
      out = shuffled(lines, rand);
      break;
    case 'trim':
      out = lines.map((l) => l.trim());
      break;
    case 'remove-empty':
      out = lines.filter((l) => l.trim() !== '');
      break;
  }
  return out.join('\n') + (trailingNewline && out.length ? '\n' : '');
}
