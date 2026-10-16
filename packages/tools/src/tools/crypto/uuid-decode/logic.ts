import { ToolError } from '@/core/types';

export interface UuidInfo {
  canonical: string;
  version: number | null;
  versionName: string;
  variant: string;
  timestamp?: { ms: number; iso: string };
  clockSeq?: number;
  node?: string;
  randomHex?: string;
}

const NAMES: Record<number, string> = {
  1: 'v1 (time + node)',
  2: 'v2 (DCE security)',
  3: 'v3 (MD5 name-based)',
  4: 'v4 (random)',
  5: 'v5 (SHA-1 name-based)',
  6: 'v6 (reordered time)',
  7: 'v7 (Unix time + random)',
  8: 'v8 (custom)',
};

/** Accepts hyphenated, bare 32-hex, braces and urn:uuid: forms. */
export function normaliseUuid(input: string): string {
  const s = input.trim().replace(/^urn:uuid:/i, '').replace(/^\{|\}$/g, '').toLowerCase();
  const bare = s.replace(/-/g, '');
  if (!/^[0-9a-f]{32}$/.test(bare)) throw new ToolError('That is not a UUID. It should be 32 hex digits, usually written 8-4-4-4-12 with hyphens.');
  if (s.includes('-') && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s)) throw new ToolError('The hyphens are in the wrong places. Use the 8-4-4-4-12 layout.');
  return `${bare.slice(0, 8)}-${bare.slice(8, 12)}-${bare.slice(12, 16)}-${bare.slice(16, 20)}-${bare.slice(20)}`;
}

const GREGORIAN_OFFSET_MS = 12219292800000n; // 1582-10-15 to 1970-01-01

function timeFromGregorian(ticks: bigint): { ms: number; iso: string } {
  const ms = Number(ticks / 10000n - GREGORIAN_OFFSET_MS);
  return { ms, iso: new Date(ms).toISOString() };
}

export function decodeUuid(input: string): UuidInfo {
  const id = normaliseUuid(input);
  const hex = id.replace(/-/g, '');
  if (hex === '0'.repeat(32)) return { canonical: id, version: null, versionName: 'Nil UUID (all zeros)', variant: 'n/a' };
  if (hex === 'f'.repeat(32)) return { canonical: id, version: null, versionName: 'Max UUID (all ones)', variant: 'n/a' };
  const version = parseInt(hex[12]!, 16);
  const variantBits = parseInt(hex[16]!, 16);
  const variant = variantBits < 8 ? 'NCS (reserved)' : variantBits < 12 ? 'RFC 9562 / RFC 4122' : variantBits < 14 ? 'Microsoft (reserved)' : 'Future (reserved)';
  const info: UuidInfo = { canonical: id, version, versionName: NAMES[version] ?? `unknown version ${version}`, variant };
  if (version === 1) {
    const ticks = (BigInt('0x' + hex.slice(13, 16)) << 48n) | (BigInt('0x' + hex.slice(8, 12)) << 32n) | BigInt('0x' + hex.slice(0, 8));
    info.timestamp = timeFromGregorian(ticks);
  } else if (version === 6) {
    const ticks = (BigInt('0x' + hex.slice(0, 8)) << 28n) | (BigInt('0x' + hex.slice(8, 12)) << 12n) | BigInt('0x' + hex.slice(13, 16));
    info.timestamp = timeFromGregorian(ticks);
  } else if (version === 7) {
    const ms = parseInt(hex.slice(0, 12), 16);
    info.timestamp = { ms, iso: new Date(ms).toISOString() };
    info.randomHex = hex.slice(12, 16).slice(1) + hex.slice(16);
  }
  if (version === 1 || version === 6) {
    info.clockSeq = parseInt(hex.slice(16, 20), 16) & 0x3fff;
    info.node = hex.slice(20).replace(/(..)(?!$)/g, '$1:');
  }
  if (version === 4) info.randomHex = hex.slice(0, 12) + hex.slice(13, 16) + hex.slice(17);
  return info;
}
