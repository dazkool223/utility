import { ToolError } from '@/core/types';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const ULID_RE = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i;
export const MAX_COUNT = 10_000;

export interface UlidOptions {
  count: number;
  monotonic: boolean;
  lowercase: boolean;
  /** Fixed timestamp in ms; omit for now. */
  time?: number;
}

export async function generateUlids(o: UlidOptions): Promise<string> {
  const { ulid, monotonicFactory } = await import('ulid');
  const n = Math.max(1, Math.min(MAX_COUNT, Math.floor(o.count)));
  if (o.time !== undefined && (!Number.isFinite(o.time) || o.time < 0 || o.time > 281474976710655)) throw new ToolError('The time is out of range (0 to 281474976710655 ms).');
  const make = o.monotonic ? monotonicFactory() : ulid;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const id = make(o.time);
    out.push(o.lowercase ? id.toLowerCase() : id);
  }
  return out.join('\n');
}

export interface UlidInfo {
  id: string;
  timestampMs: number;
  iso: string;
  randomHex: string;
  uuid: string;
}

export function decodeUlid(input: string): UlidInfo {
  const id = input.trim().toUpperCase();
  if (id.length !== 26) throw new ToolError(`A ULID has 26 characters; this has ${id.length}.`);
  if (!/^[0-9A-HJKMNP-TV-Z]+$/.test(id)) throw new ToolError('A ULID only uses 0-9 and A-Z without I, L, O and U.');
  if (!ULID_RE.test(id)) throw new ToolError('This ULID is too large: the first character must be 0-7.');
  let ts = 0;
  for (let i = 0; i < 10; i++) ts = ts * 32 + ALPHABET.indexOf(id[i]!);
  // 128-bit value -> hex (and UUID form)
  let value = 0n;
  for (const ch of id) value = value * 32n + BigInt(ALPHABET.indexOf(ch));
  const hex = value.toString(16).padStart(32, '0');
  const rand = id.slice(10);
  let r = 0n;
  for (const ch of rand) r = r * 32n + BigInt(ALPHABET.indexOf(ch));
  return {
    id,
    timestampMs: ts,
    iso: new Date(ts).toISOString(),
    randomHex: r.toString(16).padStart(20, '0'),
    uuid: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`,
  };
}
