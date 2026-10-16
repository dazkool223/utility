import { ToolError } from '@/core/types';

/**
 * Parse a page selection such as "1-3, 5, 8-" into 1-based page numbers, in the order written.
 * "8-" means page 8 to the last page, "-3" means pages 1 to 3, and "5-2" counts down.
 * Throws ToolError for anything that is not a page of the document.
 */
export function parsePageRanges(spec: string, pageCount: number): number[] {
  const text = spec.trim();
  if (!text) throw new ToolError('Enter the pages you want, for example 1-3, 5, 8-');
  const out: number[] = [];
  for (const raw of text.split(',')) {
    const part = raw.trim();
    if (!part) continue;
    const m = /^(\d*)\s*(-)?\s*(\d*)$/.exec(part);
    if (!m || (!m[1] && !m[3])) throw new ToolError(`"${part}" is not a page or a page range. Use numbers like 3 or 2-5.`);
    let from: number;
    let to: number;
    if (!m[2]) {
      from = to = Number(m[1]);
    } else {
      from = m[1] ? Number(m[1]) : 1;
      to = m[3] ? Number(m[3]) : pageCount;
    }
    for (const n of [from, to]) {
      if (n < 1 || n > pageCount) throw new ToolError(`Page ${n} does not exist. This PDF has ${pageCount} page${pageCount === 1 ? '' : 's'}.`);
    }
    const step = from <= to ? 1 : -1;
    for (let n = from; step > 0 ? n <= to : n >= to; n += step) out.push(n);
  }
  if (!out.length) throw new ToolError('Enter the pages you want, for example 1-3, 5, 8-');
  return out;
}

/** Split a page selection on commas into separate groups ("1-2, 5" gives ["1-2", "5"]). */
export function splitGroups(spec: string): string[] {
  return spec
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
