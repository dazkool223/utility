import { describe, expect, it } from 'vitest';
import { generateUla, inspectV6 } from './logic';

describe('inspectV6', () => {
  it('expands and compresses (RFC 5952)', () => {
    const i = inspectV6('2001:0db8:0000:0000:0000:ff00:0042:8329');
    expect(i.compressed).toBe('2001:db8::ff00:42:8329');
    expect(i.expanded).toBe('2001:0db8:0000:0000:0000:ff00:0042:8329');
    expect(i.type).toBe('Documentation');
    expect(i.interfaceId).toBe('0000:ff00:0042:8329');
    expect(i.subnetPrefix64).toBe('2001:db8::/64');
  });
  it('picks the longest zero run and leaves a single zero group alone', () => {
    expect(inspectV6('2001:db8:0:0:1:0:0:1').compressed).toBe('2001:db8::1:0:0:1');
    expect(inspectV6('2001:db8:0:1:1:1:1:1').compressed).toBe('2001:db8:0:1:1:1:1:1');
  });
  it('computes prefix ranges', () => {
    const i = inspectV6('2001:db8:abcd:1234::5/48');
    expect(i.network).toBe('2001:db8:abcd::/48');
    expect(i.first).toBe('2001:db8:abcd::');
    expect(i.last).toBe('2001:db8:abcd:ffff:ffff:ffff:ffff:ffff');
    expect(i.count).toBe(1n << 80n);
  });
  it('classifies special addresses', () => {
    expect(inspectV6('::1').type).toBe('Loopback');
    expect(inspectV6('fe80::1%eth0').type).toContain('Link-local');
    expect(inspectV6('fd12:3456:789a::1').type).toContain('Unique local');
    expect(inspectV6('ff02::1').type).toContain('Multicast');
    expect(inspectV6('::ffff:192.0.2.1').embeddedV4).toBe('192.0.2.1');
  });
  it('rejects bad input', () => {
    expect(() => inspectV6('')).toThrow(/Enter an IPv6/);
    expect(() => inspectV6('1:2:3')).toThrow(/not a valid IPv6/);
    expect(() => inspectV6('2001:db8::1/129')).toThrow(/between 0 and 128/);
    expect(() => inspectV6('2001:db8::/x')).toThrow(/not a number/);
    expect(() => inspectV6('192.168.0.1')).toThrow(/not a valid IPv6/);
    expect(() => inspectV6('1::2::3')).toThrow(/not a valid IPv6/);
  });
});

describe('generateUla', () => {
  it('builds an RFC 4193 /48 from a fixed global ID', () => {
    const u = generateUla(new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a]));
    expect(u.prefix48).toBe('fd12:3456:789a::/48');
    expect(u.subnets).toHaveLength(4);
    for (const s of u.subnets) expect(s.startsWith('fd12:3456:789a:')).toBe(true);
    expect(u.sample.startsWith('fd12:3456:789a:')).toBe(true);
  });
  it('random ULAs are in fd00::/8 and differ', () => {
    const a = generateUla();
    const b = generateUla();
    expect(a.prefix48).toMatch(/^fd[0-9a-f]{2}:/);
    expect(a.prefix48).not.toBe(b.prefix48);
    expect(inspectV6(a.sample).type).toContain('Unique local');
  });
  it('rejects a wrong-sized global ID', () => {
    expect(() => generateUla(new Uint8Array(4))).toThrow(/40 bits/);
  });
});
