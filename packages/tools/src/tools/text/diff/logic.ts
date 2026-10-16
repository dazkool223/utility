import { createTwoFilesPatch, diffArrays, diffChars, diffLines, diffWords } from 'diff';

export type DiffGranularity = 'lines' | 'words' | 'chars';

export interface DiffOptions {
  granularity: DiffGranularity;
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
}

export interface Part {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface Row {
  left: string | null;
  right: string | null;
  kind: 'same' | 'changed' | 'removed' | 'added';
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

const endWithNewline = (s: string) => (s && !s.endsWith('\n') ? s + '\n' : s);

export function computeDiff(a: string, b: string, o: DiffOptions): Part[] {
  if (o.granularity === 'lines') {
    a = endWithNewline(a);
    b = endWithNewline(b);
  }
  const opts = { ignoreCase: o.ignoreCase };
  if (o.granularity === 'lines') {
    if (o.ignoreWhitespace || o.ignoreCase) {
      const norm = (x: string) => {
        const t = o.ignoreWhitespace ? x.replace(/\s+/g, ' ').trim() : x;
        return o.ignoreCase ? t.toLowerCase() : t;
      };
      const split = (s: string) => (s === '' ? [] : s.replace(/\r\n/g, '\n').split('\n'));
      return diffArrays(split(a), split(b), { comparator: (l, r) => norm(l) === norm(r) }).map((p) => ({
        value: p.value.map((l) => l + '\n').join(''),
        added: p.added,
        removed: p.removed,
      }));
    }
    return diffLines(a, b).map((p) => ({ value: p.value, added: p.added, removed: p.removed }));
  }
  if (o.granularity === 'words') return diffWords(a, b, opts).map((p) => ({ value: p.value, added: p.added, removed: p.removed }));
  return diffChars(a, b, opts).map((p) => ({ value: p.value, added: p.added, removed: p.removed }));
}

function toLines(value: string): string[] {
  const lines = value.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** Pair removed and added blocks line by line for a side-by-side view. */
export function toRows(parts: Part[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]!;
    if (!p.added && !p.removed) {
      for (const l of toLines(p.value)) rows.push({ left: l, right: l, kind: 'same' });
    } else if (p.removed) {
      const next = parts[i + 1];
      const left = toLines(p.value);
      const right = next?.added ? toLines(next.value) : [];
      if (next?.added) i++;
      const n = Math.max(left.length, right.length);
      for (let k = 0; k < n; k++) {
        const l = left[k] ?? null;
        const r = right[k] ?? null;
        rows.push({ left: l, right: r, kind: l !== null && r !== null ? 'changed' : l !== null ? 'removed' : 'added' });
      }
    } else {
      for (const l of toLines(p.value)) rows.push({ left: null, right: l, kind: 'added' });
    }
  }
  return rows;
}

export function diffStats(parts: Part[], granularity: DiffGranularity): DiffStats {
  const size = (v: string) => (granularity === 'lines' ? toLines(v).length : granularity === 'words' ? (v.match(/\S+/g) ?? []).length : [...v].length);
  const s: DiffStats = { added: 0, removed: 0, unchanged: 0 };
  for (const p of parts) {
    if (p.added) s.added += size(p.value);
    else if (p.removed) s.removed += size(p.value);
    else s.unchanged += size(p.value);
  }
  return s;
}

/** Standard unified diff, ready to paste into a patch or a review. */
export function unifiedPatch(a: string, b: string): string {
  a = endWithNewline(a);
  b = endWithNewline(b);
  if (a === b) return 'No differences';
  return createTwoFilesPatch('original', 'changed', a, b, '', '', { context: 3 }).replace(/^=+\n/, '');
}
