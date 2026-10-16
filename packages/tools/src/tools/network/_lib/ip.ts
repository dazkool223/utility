import { Address4, Address6 } from 'ip-address';
import { ToolError } from '@/core/types';

export type Family = 4 | 6;
export const BITS: Record<Family, number> = { 4: 32, 6: 128 };

const V4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export function isV4(s: string): boolean {
  return V4_RE.test(s.trim());
}

export function parseV4(s: string): bigint {
  const t = s.trim();
  if (!V4_RE.test(t)) throw new ToolError(`"${t}" is not a valid IPv4 address. Use four numbers from 0 to 255 separated by dots, like 192.168.1.10.`);
  return t.split('.').reduce((n, p) => n * 256n + BigInt(p), 0n);
}

export function v4ToString(n: bigint): string {
  return [24n, 16n, 8n, 0n].map((s) => String((n >> s) & 255n)).join('.');
}

export function parseV6(s: string): bigint {
  const t = s.trim().replace(/%.*$/, '');
  if (!t.includes(':')) throw new ToolError(`"${t}" is not a valid IPv6 address.`);
  try {
    return new Address6(t).bigInt();
  } catch {
    throw new ToolError(`"${t}" is not a valid IPv6 address. Check the groups: there are 8 groups of up to 4 hex digits, and "::" may stand in for zeros once.`);
  }
}

export function v6Compressed(n: bigint): string {
  return Address6.fromBigInt(n).correctForm();
}

export function v6Expanded(n: bigint): string {
  return Address6.fromBigInt(n).canonicalForm();
}

export function parseIp(s: string): { family: Family; value: bigint } {
  const t = s.trim();
  if (t.includes(':')) return { family: 6, value: parseV6(t) };
  return { family: 4, value: parseV4(t) };
}

export function formatIp(family: Family, n: bigint): string {
  return family === 4 ? v4ToString(n) : v6Compressed(n);
}

/** Prefix length -> mask as BigInt for the family. */
export function maskOf(family: Family, prefix: number): bigint {
  const bits = BITS[family];
  return prefix === 0 ? 0n : ((1n << BigInt(prefix)) - 1n) << BigInt(bits - prefix);
}

export function parsePrefix(text: string, family: Family): number {
  if (!/^\d{1,3}$/.test(text.trim())) throw new ToolError(`The prefix length "${text}" is not a number.`);
  const p = Number(text);
  if (p < 0 || p > BITS[family]) throw new ToolError(`The prefix length must be between 0 and ${BITS[family]} for IPv${family}.`);
  return p;
}

export function trailingZeros(n: bigint, width: number): number {
  if (n === 0n) return width;
  let c = 0;
  while ((n & 1n) === 0n) {
    n >>= 1n;
    c++;
  }
  return c;
}

export interface Range {
  family: Family;
  start: bigint;
  end: bigint;
}

/** Smallest list of CIDR blocks covering [start, end] exactly. */
export function rangeToCidrs(r: Range): string[] {
  const width = BITS[r.family];
  const out: string[] = [];
  let cur = r.start;
  while (cur <= r.end) {
    let size = trailingZeros(cur, width);
    // shrink until the block fits inside the range
    while (size > 0 && cur + (1n << BigInt(size)) - 1n > r.end) size--;
    out.push(`${formatIp(r.family, cur)}/${width - size}`);
    cur += 1n << BigInt(size);
    if (cur >= 1n << BigInt(width)) break;
  }
  return out;
}

/** Parses "a.b.c.d", "a-b", "a - b", "net/len" or "ip mask" into a Range. */
export function parseRangeOrCidr(line: string): Range {
  const t = line.trim();
  if (t.includes('/')) {
    const [addr, len] = t.split('/') as [string, string];
    const { family, value } = parseIp(addr);
    const p = parsePrefix(len, family);
    const mask = maskOf(family, p);
    const start = value & mask;
    return { family, start, end: start | (~mask & ((1n << BigInt(BITS[family])) - 1n)) };
  }
  const dash = t.split(/\s*[-–—]\s*|\s+to\s+/i);
  if (dash.length === 2 && dash[0] && dash[1]) {
    const a = parseIp(dash[0]);
    const b = parseIp(dash[1]);
    if (a.family !== b.family) throw new ToolError(`"${t}" mixes IPv4 and IPv6 addresses.`);
    if (a.value > b.value) throw new ToolError(`In "${t}" the start address is higher than the end address.`);
    return { family: a.family, start: a.value, end: b.value };
  }
  if (dash.length > 2) throw new ToolError(`"${t}" is not a valid range. Use "start - end".`);
  const one = parseIp(t);
  return { family: one.family, start: one.value, end: one.value };
}

/** Sorts and merges overlapping and adjacent ranges (per family). */
export function mergeRanges(ranges: Range[]): Range[] {
  const out: Range[] = [];
  for (const family of [4, 6] as const) {
    const sorted = ranges.filter((r) => r.family === family).sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
    let cur: Range | null = null;
    for (const r of sorted) {
      if (cur && r.start <= cur.end + 1n) {
        if (r.end > cur.end) cur.end = r.end;
      } else {
        if (cur) out.push(cur);
        cur = { ...r };
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}
