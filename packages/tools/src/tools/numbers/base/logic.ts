import { ToolError } from '@/core/types';

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const MAX_BASE = 62;

function digitValue(ch: string, base: number): number {
  // bases up to 36 are case-insensitive; 37-62 use 0-9, a-z, A-Z
  const v = base <= 36 ? DIGITS.indexOf(ch.toLowerCase()) : DIGITS.indexOf(ch);
  return v >= 0 && v < base ? v : -1;
}

/** Detects 0x / 0b / 0o prefixes. Returns the base and the remaining digits. */
export function detectBase(text: string): { base: number; digits: string } | null {
  const m = /^(0x|0b|0o)(.+)$/i.exec(text);
  if (!m) return null;
  const p = m[1]!.toLowerCase();
  return { base: p === '0x' ? 16 : p === '0b' ? 2 : 8, digits: m[2]! };
}

/** Parses an integer of any size in `base` (2-62). Spaces, underscores and commas between digits are ignored. */
export function parseInBase(input: string, base: number | 'auto'): { value: bigint; base: number } {
  let t = input.trim();
  if (!t) throw new ToolError('Enter a number.');
  let negative = false;
  if (t[0] === '-' || t[0] === '+') {
    negative = t[0] === '-';
    t = t.slice(1).trim();
  }
  let b = base === 'auto' ? 10 : base;
  const prefixed = detectBase(t);
  if (prefixed && (base === 'auto' || base === prefixed.base)) {
    b = prefixed.base;
    t = prefixed.digits;
  }
  if (!Number.isInteger(b) || b < 2 || b > MAX_BASE) throw new ToolError(`The base must be a whole number from 2 to ${MAX_BASE}.`);
  t = t.replace(/[\s_,]/g, '');
  if (!t) throw new ToolError('Enter a number.');
  if (/[.]/.test(t)) throw new ToolError('Only whole numbers are supported; remove the decimal point.');
  let value = 0n;
  const B = BigInt(b);
  for (const ch of t) {
    const d = digitValue(ch, b);
    if (d < 0) throw new ToolError(`"${ch}" is not a valid digit in base ${b}${b <= 10 ? ` (digits 0-${b - 1})` : ''}.`);
    value = value * B + BigInt(d);
  }
  return { value: negative ? -value : value, base: b };
}

export function toBase(n: bigint, base: number): string {
  if (!Number.isInteger(base) || base < 2 || base > MAX_BASE) throw new ToolError(`The base must be a whole number from 2 to ${MAX_BASE}.`);
  if (n === 0n) return '0';
  const neg = n < 0n;
  let v = neg ? -n : n;
  if (base <= 36) return (neg ? '-' : '') + v.toString(base);
  const B = BigInt(base);
  let out = '';
  while (v > 0n) {
    out = DIGITS[Number(v % B)] + out;
    v /= B;
  }
  return (neg ? '-' : '') + out;
}

const group = (s: string, n: number): string => {
  const neg = s.startsWith('-');
  const body = neg ? s.slice(1) : s;
  const padded = body.padStart(Math.ceil(body.length / n) * n, '0');
  return (neg ? '-' : '') + (padded.match(new RegExp(`.{${n}}`, 'g')) ?? []).join(' ');
};

export interface BaseRow {
  label: string;
  value: string;
}

export function convertNumber(input: string, from: number | 'auto', customBase?: number): { rows: BaseRow[]; detectedBase: number } {
  const { value, base } = parseInBase(input, from);
  const rows: BaseRow[] = [
    { label: 'Binary (2)', value: group(toBase(value, 2), 4) },
    { label: 'Octal (8)', value: toBase(value, 8) },
    { label: 'Decimal (10)', value: toBase(value, 10) },
    { label: 'Hexadecimal (16)', value: toBase(value, 16).toUpperCase() },
    { label: 'Base 32', value: toBase(value, 32) },
    { label: 'Base 36', value: toBase(value, 36) },
    { label: 'Base 62', value: toBase(value, 62) },
  ];
  if (customBase && ![2, 8, 10, 16, 32, 36, 62].includes(customBase)) rows.push({ label: `Base ${customBase}`, value: toBase(value, customBase) });
  if (value < 0n) {
    for (const bits of [8, 16, 32, 64]) {
      const min = -(1n << BigInt(bits - 1));
      if (value >= min) rows.push({ label: `Two's complement (${bits}-bit)`, value: '0x' + (value + (1n << BigInt(bits))).toString(16).toUpperCase().padStart(bits / 4, '0') });
    }
  }
  rows.push({ label: 'Bits needed', value: String(value === 0n ? 1 : (value < 0n ? -value : value).toString(2).length) });
  return { rows, detectedBase: base };
}

/** Pipeline-friendly: convert one integer string between two bases. */
export function convertBase(input: string, from: number | 'auto', to: number): string {
  return toBase(parseInBase(input, from).value, to);
}
