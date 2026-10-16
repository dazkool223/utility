import { describe, expect, it } from 'vitest';
import { describeMac, formatMac, generateMacs, parseMac } from './logic';

const get = (rows: Array<[string, string]>, k: string) => rows.find(([key]) => key === k)?.[1];

describe('parseMac / formatMac', () => {
  it('reads every common notation', () => {
    for (const s of ['00:1A:2B:3C:4D:5E', '00-1a-2b-3c-4d-5e', '001A.2B3C.4D5E', '001a2b3c4d5e', '  00:1a:2b:3c:4d:5e  ']) {
      expect(formatMac(parseMac(s), ':', false)).toBe('00:1a:2b:3c:4d:5e');
    }
  });
  it('formats every notation', () => {
    const b = parseMac('00:1A:2B:3C:4D:5E');
    expect(formatMac(b, '-', true)).toBe('00-1A-2B-3C-4D-5E');
    expect(formatMac(b, '.', false)).toBe('001a.2b3c.4d5e');
    expect(formatMac(b, '', true)).toBe('001A2B3C4D5E');
  });
  it('rejects malformed addresses', () => {
    expect(() => parseMac('')).toThrow(/Enter a MAC/);
    expect(() => parseMac('00:1A:2B:3C:4D')).toThrow(/12 hex digits; this has 10/);
    expect(() => parseMac('00:1A:2B:3C:4D:5G')).toThrow(/not hexadecimal/);
    expect(() => parseMac('00:1A-2B:3C-4D:5E')).toThrow(/separators/);
    expect(() => parseMac('00:1a:2b:ff:fe:3c:4d:5e')).toThrow(/EUI-64/);
  });
});

describe('describeMac', () => {
  it('derives flags, OUI, EUI-64 and the SLAAC link-local address', () => {
    const r = describeMac('00:1A:2B:3C:4D:5E');
    expect(get(r, 'OUI (vendor prefix)')).toBe('00:1A:2B');
    expect(get(r, 'Type')).toMatch(/^Unicast/);
    expect(get(r, 'Administration')).toMatch(/^Universally/);
    expect(get(r, 'EUI-64 interface ID')).toBe('021a:2bff:fe3c:4d5e');
    expect(get(r, 'IPv6 link-local (SLAAC)')).toBe('fe80::21a:2bff:fe3c:4d5e');
  });
  it('detects multicast and locally administered bits', () => {
    expect(get(describeMac('01:00:5e:00:00:fb'), 'Type')).toMatch(/^Multicast/);
    expect(get(describeMac('02:00:00:00:00:01'), 'Administration')).toMatch(/^Locally/);
  });
});

describe('generateMacs', () => {
  it('generates locally administered unicast addresses by default', () => {
    const macs = generateMacs({ count: 200, separator: ':', upper: false, administration: 'local', multicast: false }).split('\n');
    expect(macs).toHaveLength(200);
    for (const m of macs) {
      expect(m).toMatch(/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/);
      const first = parseInt(m.slice(0, 2), 16);
      expect(first & 2).toBe(2);
      expect(first & 1).toBe(0);
    }
    expect(new Set(macs).size).toBeGreaterThan(190);
  });
  it('honours global/multicast flags, separators and case', () => {
    const m = generateMacs({ count: 50, separator: '-', upper: true, administration: 'global', multicast: true }).split('\n');
    for (const x of m) {
      expect(x).toMatch(/^([0-9A-F]{2}-){5}[0-9A-F]{2}$/);
      const first = parseInt(x.slice(0, 2), 16);
      expect(first & 3).toBe(1);
    }
  });
  it('uses a fixed OUI', () => {
    for (const m of generateMacs({ count: 20, separator: ':', upper: false, administration: 'local', multicast: false, oui: '00-50-56' }).split('\n')) expect(m.startsWith('00:50:56:')).toBe(true);
    expect(() => generateMacs({ count: 1, separator: ':', upper: false, administration: 'local', multicast: false, oui: '00:50' })).toThrow(/OUI/);
  });
  it('clamps count', () => {
    expect(generateMacs({ count: 0, separator: ':', upper: false, administration: 'local', multicast: false }).split('\n')).toHaveLength(1);
  });
});
