import { ToolError } from '@/core/types';
import { Address6 } from 'ip-address';
import { parseV6, v4ToString, v6Compressed, v6Expanded } from '../_lib/ip';

export interface ParsedIp {
  family: 4 | 6;
  value: bigint;
  /** How the input was understood, e.g. "dotted decimal", "hexadecimal integer". */
  form: string;
}

function numberPart(p: string, whole: string): bigint {
  if (/^0x[0-9a-f]+$/i.test(p)) return BigInt(p);
  if (/^0[0-7]+$/.test(p)) return BigInt('0o' + p.slice(1));
  if (/^(0|[1-9]\d*)$/.test(p)) return BigInt(p);
  throw new ToolError(`"${whole}" is not an IP address in a format this Tool understands.`);
}

/** Understands dotted decimal, inet_aton short/octal/hex forms, 32-bit integers (decimal, hex, binary) and IPv6. */
export function parseFlexibleIp(input: string): ParsedIp {
  const t = input.trim();
  if (!t) throw new ToolError('Enter an IP address in any format, such as 192.168.1.1, 3232235777 or 0xC0A80101.');
  if (t.includes(':')) return { family: 6, value: parseV6(t), form: 'IPv6' };
  if (/^[01]{32}$/.test(t)) return { family: 4, value: BigInt('0b' + t), form: 'binary' };
  if (/^[01]{8}(\.[01]{8}){3}$/.test(t)) return { family: 4, value: BigInt('0b' + t.replace(/\./g, '')), form: 'dotted binary' };
  const parts = t.split('.');
  if (parts.length > 4) throw new ToolError(`"${t}" has too many parts for an IPv4 address.`);
  const nums = parts.map((p) => numberPart(p, t));
  const last = nums.pop()!;
  const maxLast = 256n ** BigInt(5 - parts.length) - 1n;
  if (last > maxLast) throw new ToolError(`The last number in "${t}" is too large for an address with ${parts.length} part${parts.length === 1 ? '' : 's'}.`);
  if (nums.some((n) => n > 255n)) throw new ToolError(`Each part before the last must be 0 to 255 in "${t}".`);
  let value = last;
  nums.forEach((n, i) => (value += n << BigInt(8 * (3 - i))));
  const form =
    parts.length === 1
      ? /^0x/i.test(t)
        ? 'hexadecimal integer'
        : /^0\d/.test(t)
          ? 'octal integer'
          : 'decimal integer'
      : parts.length === 4 && parts.every((p) => /^(0|[1-9]\d{0,2})$/.test(p))
        ? 'dotted decimal'
        : 'dotted (octal/hex/short form)';
  return { family: 4, value, form };
}

const groups = (n: bigint, width: number): string => n.toString(2).padStart(width, '0');

export function reverseV4(n: bigint): string {
  return v4ToString(n).split('.').reverse().join('.') + '.in-addr.arpa';
}

export function reverseV6(n: bigint): string {
  return v6Expanded(n).replace(/:/g, '').split('').reverse().join('.') + '.ip6.arpa';
}

export function describeIp(input: string): Array<[string, string]> {
  const p = parseFlexibleIp(input);
  const rows: Array<[string, string]> = [['Understood as', p.form]];
  if (p.family === 4) {
    const n = p.value;
    const oct = [24n, 16n, 8n, 0n].map((s) => (n >> s) & 255n);
    rows.push(
      ['Dotted decimal', v4ToString(n)],
      ['Integer', n.toString()],
      ['Hexadecimal', '0x' + n.toString(16).padStart(8, '0').toUpperCase()],
      ['Dotted hexadecimal', oct.map((o) => '0x' + o.toString(16).padStart(2, '0')).join('.')],
      ['Dotted octal', oct.map((o) => '0' + o.toString(8)).join('.')],
      ['Binary', groups(n, 32)],
      ['Dotted binary', oct.map((o) => groups(o, 8)).join('.')],
      ['IPv4-mapped IPv6', `::ffff:${v4ToString(n)}`],
      ['IPv4-mapped IPv6 (hex)', v6Compressed(0xffff00000000n + n)],
      ['6to4 prefix', v6Compressed((0x2002n << 112n) + (n << 80n)).replace(/::$/, '::') + '/48'],
      ['Reverse DNS (PTR)', reverseV4(n)],
    );
  } else {
    const n = p.value;
    const a = new Address6(v6Expanded(n));
    rows.push(
      ['Compressed', v6Compressed(n)],
      ['Expanded', v6Expanded(n)],
      ['Integer', n.toString()],
      ['Hexadecimal', '0x' + n.toString(16).padStart(32, '0')],
      ['Type', a.getType()],
      ['Reverse DNS (PTR)', reverseV6(n)],
    );
    if (n >> 32n === 0xffffn) rows.push(['Embedded IPv4', v4ToString(n & 0xffffffffn)]);
  }
  return rows;
}
