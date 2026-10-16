import { ToolError } from '@/core/types';
import { bytesToHex, randomBytes } from '../../crypto/_lib/bytes';
import { v6Compressed } from '../_lib/ip';

export type MacSeparator = ':' | '-' | '.' | '';

export function parseMac(input: string): Uint8Array {
  const t = input.trim();
  if (!t) throw new ToolError('Enter a MAC address, like 00:1A:2B:3C:4D:5E.');
  const hex = t.replace(/[:\-.\s]/g, '');
  if (!/^[0-9a-fA-F]+$/.test(hex)) throw new ToolError(`"${t}" contains characters that are not hexadecimal digits.`);
  if (hex.length === 16) throw new ToolError('That is a 64-bit EUI-64 identifier, not a 48-bit MAC address.');
  if (hex.length !== 12) throw new ToolError(`A MAC address has 12 hex digits; this has ${hex.length}.`);
  if (!/^([0-9a-fA-F]{2}([:-]))([0-9a-fA-F]{2}\2){4}[0-9a-fA-F]{2}$|^([0-9a-fA-F]{4}\.){2}[0-9a-fA-F]{4}$|^[0-9a-fA-F]{12}$/.test(t))
    throw new ToolError('The separators are mixed up. Use one style: aa:bb:cc:dd:ee:ff, aa-bb-cc-dd-ee-ff, aabb.ccdd.eeff or aabbccddeeff.');
  const out = new Uint8Array(6);
  for (let i = 0; i < 6; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function formatMac(b: Uint8Array, sep: MacSeparator, upper: boolean): string {
  let s: string;
  if (sep === '.') s = [0, 2, 4].map((i) => bytesToHex(b.subarray(i, i + 2))).join('.');
  else s = bytesToHex(b, false, sep);
  return upper ? s.toUpperCase() : s;
}

export function describeMac(input: string): Array<[string, string]> {
  const b = parseMac(input);
  const multicast = (b[0]! & 1) === 1;
  const local = (b[0]! & 2) === 2;
  const eui = new Uint8Array([b[0]! ^ 2, b[1]!, b[2]!, 0xff, 0xfe, b[3]!, b[4]!, b[5]!]);
  const iid = BigInt('0x' + bytesToHex(eui));
  return [
    ['Colon', formatMac(b, ':', false)],
    ['Colon (uppercase)', formatMac(b, ':', true)],
    ['Hyphen (Windows)', formatMac(b, '-', true)],
    ['Dot (Cisco)', formatMac(b, '.', false)],
    ['Plain', formatMac(b, '', false)],
    ['OUI (vendor prefix)', formatMac(b.subarray(0, 3), ':', true)],
    ['Type', multicast ? 'Multicast (group address)' : 'Unicast'],
    ['Administration', local ? 'Locally administered' : 'Universally administered (vendor-assigned)'],
    ['EUI-64 interface ID', eui.length ? bytesToHex(eui, false, ':').replace(/(..):(..)/g, '$1$2') : ''],
    ['IPv6 link-local (SLAAC)', v6Compressed((0xfe80n << 112n) | iid)],
  ];
}

export interface MacGenOptions {
  count: number;
  separator: MacSeparator;
  upper: boolean;
  /** 'local' sets the locally-administered bit (safe for private use). */
  administration: 'local' | 'global';
  multicast: boolean;
  /** Optional fixed OUI (3 bytes), e.g. "00:50:56". */
  oui?: string;
}

export const MAX_COUNT = 10_000;

export function generateMacs(o: MacGenOptions): string {
  const n = Math.max(1, Math.min(MAX_COUNT, Math.floor(o.count)));
  let prefix: Uint8Array | null = null;
  if (o.oui?.trim()) {
    const hex = o.oui.trim().replace(/[:\-.\s]/g, '');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) throw new ToolError('The vendor prefix (OUI) must be 3 bytes: 6 hex digits like 00:50:56.');
    prefix = new Uint8Array([0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  }
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const b = randomBytes(6);
    if (prefix) b.set(prefix, 0);
    else {
      b[0] = o.administration === 'local' ? b[0]! | 2 : b[0]! & ~2;
      b[0] = o.multicast ? b[0]! | 1 : b[0]! & ~1;
    }
    out.push(formatMac(b, o.separator, o.upper));
  }
  return out.join('\n');
}
