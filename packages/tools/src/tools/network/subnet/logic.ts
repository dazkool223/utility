import { ToolError } from '@/core/types';
import { maskOf, parseV4, v4ToString } from '../_lib/ip';

export interface SubnetInfo {
  address: string;
  prefix: number;
  netmask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: bigint;
  usableHosts: bigint;
  cidr: string;
  ipClass: string;
  kind: string;
  addressBinary: string;
  maskBinary: string;
  integer: bigint;
  hex: string;
}

function bin(n: bigint): string {
  return [24n, 16n, 8n, 0n].map((s) => ((n >> s) & 255n).toString(2).padStart(8, '0')).join('.');
}

/** Converts a dotted netmask like 255.255.255.0 to its prefix length; rejects non-contiguous masks. */
export function maskToPrefix(mask: string): number {
  const n = parseV4(mask);
  const inverted = ~n & 0xffffffffn;
  if ((inverted & (inverted + 1n)) !== 0n) throw new ToolError(`"${mask}" is not a valid subnet mask: its 1 bits must come first, with no gaps (like 255.255.254.0).`);
  return 32 - inverted.toString(2).replace(/^0+/, '').length;
}

const SPECIAL: Array<[string, number, string]> = [
  ['0.0.0.0', 8, 'This network (RFC 1122)'],
  ['10.0.0.0', 8, 'Private (RFC 1918)'],
  ['100.64.0.0', 10, 'Carrier-grade NAT (RFC 6598)'],
  ['127.0.0.0', 8, 'Loopback'],
  ['169.254.0.0', 16, 'Link-local (APIPA)'],
  ['172.16.0.0', 12, 'Private (RFC 1918)'],
  ['192.0.0.0', 24, 'IETF protocol assignments'],
  ['192.0.2.0', 24, 'Documentation (TEST-NET-1)'],
  ['192.88.99.0', 24, '6to4 relay anycast (deprecated)'],
  ['192.168.0.0', 16, 'Private (RFC 1918)'],
  ['198.18.0.0', 15, 'Benchmarking'],
  ['198.51.100.0', 24, 'Documentation (TEST-NET-2)'],
  ['203.0.113.0', 24, 'Documentation (TEST-NET-3)'],
  ['224.0.0.0', 4, 'Multicast'],
  ['240.0.0.0', 4, 'Reserved (class E)'],
];

export function classify(n: bigint): string {
  if (n === 0xffffffffn) return 'Limited broadcast';
  for (const [net, p, name] of SPECIAL) {
    const m = maskOf(4, p);
    if ((n & m) === parseV4(net)) return name;
  }
  return 'Public';
}

export function parseSubnetInput(input: string): { ip: bigint; prefix: number } {
  const t = input.trim();
  if (!t) throw new ToolError('Enter an IPv4 address with a prefix, like 192.168.1.10/24.');
  if (t.includes(':')) throw new ToolError('That looks like IPv6. Use the IPv6 Tools for IPv6 addresses.');
  let m = /^(\S+?)\s*\/\s*(\S+)$/.exec(t);
  if (m) {
    const [, addr, len] = m as unknown as [string, string, string];
    if (/^\d{1,2}$/.test(len)) {
      const p = Number(len);
      if (p > 32) throw new ToolError('The prefix length must be between 0 and 32 for IPv4.');
      return { ip: parseV4(addr), prefix: p };
    }
    return { ip: parseV4(addr), prefix: maskToPrefix(len) };
  }
  m = /^(\S+)\s+(\S+)$/.exec(t);
  if (m) {
    const [, addr, mask] = m as unknown as [string, string, string];
    // "ip wildcard" (Cisco) is detected by a leading 0 octet pattern is ambiguous, so only netmasks are accepted here
    return { ip: parseV4(addr), prefix: maskToPrefix(mask) };
  }
  return { ip: parseV4(t), prefix: 32 };
}

export function calculateSubnet(input: string): SubnetInfo {
  const { ip, prefix } = parseSubnetInput(input);
  const mask = maskOf(4, prefix);
  const network = ip & mask;
  const broadcast = network | (~mask & 0xffffffffn);
  const total = 1n << BigInt(32 - prefix);
  let first = network + 1n;
  let last = broadcast - 1n;
  let usable = total - 2n;
  if (prefix === 31) {
    first = network;
    last = broadcast;
    usable = 2n;
  } else if (prefix === 32) {
    first = last = network;
    usable = 1n;
  }
  const lead = Number(ip >> 24n);
  const ipClass = lead < 128 ? 'A' : lead < 192 ? 'B' : lead < 224 ? 'C' : lead < 240 ? 'D (multicast)' : 'E (reserved)';
  return {
    address: v4ToString(ip),
    prefix,
    netmask: v4ToString(mask),
    wildcard: v4ToString(~mask & 0xffffffffn),
    network: v4ToString(network),
    broadcast: v4ToString(broadcast),
    firstHost: v4ToString(first),
    lastHost: v4ToString(last),
    totalAddresses: total,
    usableHosts: usable,
    cidr: `${v4ToString(network)}/${prefix}`,
    ipClass,
    kind: classify(ip),
    addressBinary: bin(ip),
    maskBinary: bin(mask),
    integer: ip,
    hex: '0x' + ip.toString(16).padStart(8, '0').toUpperCase(),
  };
}

/** Splits `cidr` into subnets of `newPrefix` (at most `limit` results). */
export function splitSubnet(cidr: string, newPrefix: number, limit = 1024): { subnets: string[]; total: bigint } {
  const { ip, prefix } = parseSubnetInput(cidr);
  if (!Number.isInteger(newPrefix) || newPrefix < prefix || newPrefix > 32) throw new ToolError(`The new prefix must be between /${prefix} and /32.`);
  const net = ip & maskOf(4, prefix);
  const total = 1n << BigInt(newPrefix - prefix);
  const step = 1n << BigInt(32 - newPrefix);
  const subnets: string[] = [];
  for (let i = 0n; i < total && i < BigInt(limit); i++) subnets.push(`${v4ToString(net + i * step)}/${newPrefix}`);
  return { subnets, total };
}
