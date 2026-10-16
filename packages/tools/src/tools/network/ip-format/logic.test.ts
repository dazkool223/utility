import { describe, expect, it } from 'vitest';
import { describeIp, parseFlexibleIp, reverseV4, reverseV6 } from './logic';

const get = (rows: Array<[string, string]>, k: string) => rows.find(([key]) => key === k)?.[1];

describe('parseFlexibleIp', () => {
  it('understands every common IPv4 form for 192.168.1.1', () => {
    const want = 3232235777n;
    for (const s of ['192.168.1.1', '3232235777', '0xC0A80101', '0300.0250.0001.0001', '0xc0.0xa8.0x01.0x01', '192.168.257', '192.11010305', '11000000101010000000000100000001', '11000000.10101000.00000001.00000001']) {
      expect(parseFlexibleIp(s).value, s).toBe(want);
    }
  });
  it('labels the form', () => {
    expect(parseFlexibleIp('1.2.3.4').form).toBe('dotted decimal');
    expect(parseFlexibleIp('0x7f000001').form).toBe('hexadecimal integer');
    expect(parseFlexibleIp('2130706433').form).toBe('decimal integer');
  });
  it('edge values', () => {
    expect(parseFlexibleIp('0').value).toBe(0n);
    expect(parseFlexibleIp('4294967295').value).toBe(0xffffffffn);
    expect(parseFlexibleIp('127.1').value).toBe(0x7f000001n);
  });
  it('rejects malformed input', () => {
    expect(() => parseFlexibleIp('')).toThrow(/Enter an IP/);
    expect(() => parseFlexibleIp('4294967296')).toThrow(/too large/);
    expect(() => parseFlexibleIp('256.1.1.1')).toThrow(/0 to 255/);
    expect(() => parseFlexibleIp('1.2.3.4.5')).toThrow(/too many/);
    expect(() => parseFlexibleIp('abc')).toThrow(/not an IP/);
    expect(() => parseFlexibleIp('1:2:3')).toThrow(/not a valid IPv6/);
  });
});

describe('describeIp', () => {
  it('IPv4 output', () => {
    const r = describeIp('192.168.1.1');
    expect(get(r, 'Integer')).toBe('3232235777');
    expect(get(r, 'Hexadecimal')).toBe('0xC0A80101');
    expect(get(r, 'Dotted binary')).toBe('11000000.10101000.00000001.00000001');
    expect(get(r, 'IPv4-mapped IPv6 (hex)')).toBe('::ffff:c0a8:101');
    expect(get(r, 'Reverse DNS (PTR)')).toBe('1.1.168.192.in-addr.arpa');
    expect(get(r, '6to4 prefix')).toBe('2002:c0a8:101::/48');
  });
  it('IPv6 output', () => {
    const r = describeIp('2001:db8::1');
    expect(get(r, 'Expanded')).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(get(r, 'Type')).toBe('Documentation');
    expect(get(r, 'Reverse DNS (PTR)')).toBe('1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa');
    expect(get(describeIp('::ffff:10.0.0.1'), 'Embedded IPv4')).toBe('10.0.0.1');
  });
  it('reverse helpers', () => {
    expect(reverseV4(0x08080808n)).toBe('8.8.8.8.in-addr.arpa');
    expect(reverseV6(1n).startsWith('1.0.0.0')).toBe(true);
  });
});
