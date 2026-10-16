import { ToolError } from '@/core/types';

export interface HexOptions {
  separator: 'space' | 'none' | '0x' | 'colon';
  uppercase: boolean;
}

export function textToHex(text: string, { separator, uppercase }: HexOptions): string {
  const parts = Array.from(new TextEncoder().encode(text), (b) => {
    const h = b.toString(16).padStart(2, '0');
    return uppercase ? h.toUpperCase() : h;
  });
  if (separator === 'none') return parts.join('');
  if (separator === 'colon') return parts.join(':');
  if (separator === '0x') return parts.map((p) => '0x' + p).join(' ');
  return parts.join(' ');
}

export function hexToBytes(input: string): Uint8Array {
  const clean = input.replace(/0x/gi, '').replace(/\\x/gi, '').replace(/[\s,:%-]/g, '');
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new ToolError('Hex can only contain 0-9 and a-f (spaces, commas, colons and 0x prefixes are fine).');
  if (clean.length % 2 !== 0) throw new ToolError('Hex needs an even number of digits: two per byte.');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function hexToText(input: string): string {
  const bytes = hexToBytes(input);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new ToolError('These bytes are not valid UTF-8 text.');
  }
}

/** Classic hexdump: offset, 16 bytes in hex, then printable ASCII. */
export function hexdump(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const lines: string[] = [];
  for (let off = 0; off < bytes.length; off += 16) {
    const chunk = bytes.subarray(off, off + 16);
    const hex = Array.from(chunk, (b) => b.toString(16).padStart(2, '0'));
    const left = hex.slice(0, 8).join(' ');
    const right = hex.slice(8).join(' ');
    const ascii = Array.from(chunk, (b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.')).join('');
    lines.push(`${off.toString(16).padStart(8, '0')}  ${left.padEnd(23)}  ${right.padEnd(23)}  |${ascii}|`);
  }
  return lines.join('\n');
}
