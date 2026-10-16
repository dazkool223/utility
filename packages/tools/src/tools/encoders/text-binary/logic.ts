import { ToolError } from '@/core/types';

export type ByteBase = 2 | 8 | 10 | 16;

const WIDTH: Record<ByteBase, number> = { 2: 8, 8: 3, 10: 3, 16: 2 };
const DIGITS: Record<ByteBase, RegExp> = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^[0-9]+$/, 16: /^[0-9a-fA-F]+$/ };

export function textToBytesString(text: string, base: ByteBase, separator = ' '): string {
  const bytes = new TextEncoder().encode(text);
  const out: string[] = [];
  for (const b of bytes) out.push(b.toString(base).padStart(WIDTH[base], '0').toUpperCase());
  return out.join(separator);
}

export function bytesStringToText(input: string, base: ByteBase): string {
  const tokens = input.trim().split(/[\s,]+/).filter(Boolean);
  let groups = tokens;
  if (base === 2 && tokens.length === 1 && tokens[0]!.length > 8) {
    const s = tokens[0]!;
    if (s.length % 8 !== 0) throw new ToolError(`Binary input must be a multiple of 8 digits; this has ${s.length}.`);
    groups = s.match(/.{8}/g) ?? [];
  }
  const bytes = new Uint8Array(groups.length);
  groups.forEach((g, i) => {
    const t = base === 16 ? g.replace(/^0x/i, '') : g;
    if (!DIGITS[base].test(t)) throw new ToolError(`"${g}" is not a valid base-${base} number.`);
    const n = parseInt(t, base);
    if (n > 255) throw new ToolError(`"${g}" is larger than one byte (255).`);
    bytes[i] = n;
  });
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new ToolError('These bytes are not valid UTF-8 text.');
  }
}
