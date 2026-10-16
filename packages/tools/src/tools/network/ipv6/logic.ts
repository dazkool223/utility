import { Address6 } from 'ip-address';
import { ToolError } from '@/core/types';
import { randomBytes } from '../../crypto/_lib/bytes';
import { maskOf, parsePrefix, parseV6, v6Compressed, v6Expanded } from '../_lib/ip';
import { reverseV6 } from '../ip-format/logic';

const ALL = (1n << 128n) - 1n;

export interface V6Info {
  compressed: string;
  expanded: string;
  prefix: number | null;
  type: string;
  network?: string;
  first?: string;
  last?: string;
  count?: bigint;
  reverse: string;
  interfaceId: string;
  subnetPrefix64: string;
  embeddedV4?: string;
}

export function inspectV6(input: string): V6Info {
  const t = input.trim();
  if (!t) throw new ToolError('Enter an IPv6 address, like 2001:db8::1 or fd00::/8.');
  const [addr, len] = t.split('/') as [string, string | undefined];
  const n = parseV6(addr);
  const prefix = len === undefined ? null : parsePrefix(len, 6);
  const a = new Address6(v6Expanded(n));
  const info: V6Info = {
    compressed: v6Compressed(n),
    expanded: v6Expanded(n),
    prefix,
    type: a.getType(),
    reverse: reverseV6(n),
    interfaceId: v6Expanded(n & ((1n << 64n) - 1n)).split(':').slice(4).join(':'),
    subnetPrefix64: v6Compressed(n & maskOf(6, 64)) + '/64',
  };
  if (prefix !== null) {
    const mask = maskOf(6, prefix);
    const first = n & mask;
    const last = first | (~mask & ALL);
    info.network = `${v6Compressed(first)}/${prefix}`;
    info.first = v6Compressed(first);
    info.last = v6Compressed(last);
    info.count = 1n << BigInt(128 - prefix);
  }
  if (n >> 32n === 0xffffn) info.embeddedV4 = [24n, 16n, 8n, 0n].map((s) => String((n >> s) & 255n)).join('.');
  return info;
}

export interface Ula {
  globalId: string;
  prefix48: string;
  subnets: string[];
  sample: string;
}

/** RFC 4193 Unique Local Address: fd + 40 random bits = /48 prefix. */
export function generateUla(bytes: Uint8Array = randomBytes(5), subnetCount = 4): Ula {
  if (bytes.length !== 5) throw new ToolError('A global ID needs exactly 40 bits.');
  let gid = 0n;
  for (const b of bytes) gid = (gid << 8n) | BigInt(b);
  const base = (0xfdn << 120n) | (gid << 80n);
  const subnets: string[] = [];
  const rnd = randomBytes(2 * subnetCount);
  for (let i = 0; i < subnetCount; i++) {
    const sid = (BigInt(rnd[2 * i]!) << 8n) | BigInt(rnd[2 * i + 1]!);
    subnets.push(v6Compressed(base | (sid << 64n)) + '/64');
  }
  const host = randomBytes(8).reduce((n, b) => (n << 8n) | BigInt(b), 0n);
  return {
    globalId: gid.toString(16).padStart(10, '0').replace(/(.{2})(?=.)/g, '$1').toUpperCase(),
    prefix48: v6Compressed(base) + '/48',
    subnets,
    sample: v6Compressed(base | host),
  };
}
