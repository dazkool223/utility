import { describe, expect, it } from 'vitest';
import { convertRanges, coverage } from './logic';

describe('range -> CIDR', () => {
  it('splits a range into the minimal CIDR blocks', () => {
    expect(convertRanges('10.0.0.1 - 10.0.0.6', 'range-to-cidr')).toBe('10.0.0.1/32\n10.0.0.2/31\n10.0.0.4/31\n10.0.0.6/32');
    expect(convertRanges('192.168.0.0 - 192.168.0.255', 'range-to-cidr')).toBe('192.168.0.0/24');
    expect(convertRanges('0.0.0.0 - 255.255.255.255', 'range-to-cidr')).toBe('0.0.0.0/0');
    expect(convertRanges('1.1.1.1', 'range-to-cidr')).toBe('1.1.1.1/32');
  });
  it('handles IPv6 ranges', () => {
    expect(convertRanges('2001:db8:: - 2001:db8::ffff', 'range-to-cidr')).toBe('2001:db8::/112');
    expect(convertRanges('::1 - ::2', 'range-to-cidr')).toBe('::1/128\n::2/128');
  });
  it('accepts various separators and comments', () => {
    expect(convertRanges('10.0.0.0 to 10.0.0.1 # lab\n10.0.1.0–10.0.1.1', 'range-to-cidr')).toBe('10.0.0.0/31\n10.0.1.0/31');
  });
  it('end of address space does not loop forever', () => {
    expect(convertRanges('255.255.255.254 - 255.255.255.255', 'range-to-cidr')).toBe('255.255.255.254/31');
  });
});

describe('CIDR -> range', () => {
  it('shows start, end and size', () => {
    expect(convertRanges('192.168.1.77/24', 'cidr-to-range')).toBe('192.168.1.0 - 192.168.1.255  (256 addresses)');
    expect(convertRanges('8.8.8.8', 'cidr-to-range')).toBe('8.8.8.8 - 8.8.8.8  (1 address)');
    expect(convertRanges('2001:db8::/126', 'cidr-to-range')).toBe('2001:db8:: - 2001:db8::3  (4 addresses)');
  });
});

describe('merge', () => {
  it('merges adjacent and overlapping blocks', () => {
    expect(convertRanges('10.0.0.0/25\n10.0.0.128/25', 'merge')).toBe('10.0.0.0/24');
    expect(convertRanges('10.0.0.0/24\n10.0.0.64/26\n10.0.1.0/24', 'merge')).toBe('10.0.0.0/23');
    expect(convertRanges('10.0.0.5\n10.0.0.1\n10.0.0.2\n10.0.0.3\n10.0.0.4', 'merge')).toBe('10.0.0.1/32\n10.0.0.2/31\n10.0.0.4/31'.replace('10.0.0.4/31', '10.0.0.4/31'));
  });
  it('keeps families and gaps separate', () => {
    expect(convertRanges('10.0.0.0/24\n10.0.2.0/24\n2001:db8::/32', 'merge')).toBe('10.0.0.0/24\n10.0.2.0/24\n2001:db8::/32');
  });
  it('reports coverage', () => {
    expect(coverage('10.0.0.0/25\n10.0.0.128/25')).toEqual({ blocks: 1, addresses: 256n });
  });
});

describe('malformed input', () => {
  it('gives plain errors that name the line', () => {
    expect(() => convertRanges('', 'merge')).toThrow(/one range/);
    expect(() => convertRanges('10.0.0.0/24\nnope', 'merge')).toThrow(/Line "nope"/);
    expect(() => convertRanges('10.0.0.9 - 10.0.0.1', 'range-to-cidr')).toThrow(/higher than the end/);
    expect(() => convertRanges('10.0.0.1 - ::1', 'range-to-cidr')).toThrow(/mixes/);
    expect(() => convertRanges('10.0.0.0/33', 'range-to-cidr')).toThrow(/between 0 and 32/);
  });
});
