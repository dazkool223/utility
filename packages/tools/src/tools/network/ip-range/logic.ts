import { ToolError } from '@/core/types';
import { BITS, formatIp, mergeRanges, parseRangeOrCidr, rangeToCidrs, type Range } from '../_lib/ip';

export type RangeMode = 'range-to-cidr' | 'cidr-to-range' | 'merge';

function parseLines(input: string): Range[] {
  const lines = input
    .split(/[\n,;]+/)
    .map((l) => l.replace(/#.*$/, '').trim())
    .filter(Boolean);
  if (!lines.length) throw new ToolError('Enter one range, CIDR block or address per line.');
  return lines.map((l) => {
    try {
      return parseRangeOrCidr(l);
    } catch (e) {
      throw new ToolError(`Line "${l}": ${e instanceof Error ? e.message : String(e)}`);
    }
  });
}

const count = (r: Range) => r.end - r.start + 1n;

export function convertRanges(input: string, mode: RangeMode): string {
  const ranges = parseLines(input);
  if (mode === 'range-to-cidr') return ranges.flatMap(rangeToCidrs).join('\n');
  if (mode === 'merge') return mergeRanges(ranges).flatMap(rangeToCidrs).join('\n');
  return ranges
    .map((r) => `${formatIp(r.family, r.start)} - ${formatIp(r.family, r.end)}  (${count(r).toLocaleString('en')} address${count(r) === 1n ? '' : 'es'})`)
    .join('\n');
}

/** Total addresses covered after merging (for display). */
export function coverage(input: string): { blocks: number; addresses: bigint } {
  const merged = mergeRanges(parseLines(input));
  return { blocks: merged.flatMap(rangeToCidrs).length, addresses: merged.reduce((n, r) => n + count(r), 0n) };
}

export { BITS };
