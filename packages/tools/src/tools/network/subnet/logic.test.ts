import { describe, expect, it } from 'vitest';
import { calculateSubnet, classify, maskToPrefix, splitSubnet } from './logic';
import { parseV4 } from '../_lib/ip';

describe('calculateSubnet', () => {
  it('192.168.1.10/24', () => {
    const s = calculateSubnet('192.168.1.10/24');
    expect(s).toMatchObject({
      network: '192.168.1.0',
      broadcast: '192.168.1.255',
      netmask: '255.255.255.0',
      wildcard: '0.0.0.255',
      firstHost: '192.168.1.1',
      lastHost: '192.168.1.254',
      usableHosts: 254n,
      totalAddresses: 256n,
      cidr: '192.168.1.0/24',
      ipClass: 'C',
      kind: 'Private (RFC 1918)',
    });
    expect(s.maskBinary).toBe('11111111.11111111.11111111.00000000');
    expect(s.hex).toBe('0xC0A8010A');
    expect(s.integer).toBe(3232235786n);
  });
  it('non-octet boundary: 10.1.2.3/20', () => {
    const s = calculateSubnet('10.1.2.3/20');
    expect(s.network).toBe('10.1.0.0');
    expect(s.broadcast).toBe('10.1.15.255');
    expect(s.usableHosts).toBe(4094n);
    expect(s.netmask).toBe('255.255.240.0');
  });
  it('edge prefixes /0 /31 /32', () => {
    expect(calculateSubnet('1.2.3.4/0')).toMatchObject({ network: '0.0.0.0', broadcast: '255.255.255.255', totalAddresses: 4294967296n });
    expect(calculateSubnet('10.0.0.0/31')).toMatchObject({ usableHosts: 2n, firstHost: '10.0.0.0', lastHost: '10.0.0.1' });
    expect(calculateSubnet('8.8.8.8/32')).toMatchObject({ usableHosts: 1n, firstHost: '8.8.8.8', kind: 'Public' });
  });
  it('accepts netmask forms and a bare address', () => {
    expect(calculateSubnet('172.16.5.4 255.255.0.0').cidr).toBe('172.16.0.0/16');
    expect(calculateSubnet('172.16.5.4/255.255.0.0').cidr).toBe('172.16.0.0/16');
    expect(calculateSubnet('  1.1.1.1  ').prefix).toBe(32);
  });
  it('rejects malformed input in plain language', () => {
    expect(() => calculateSubnet('')).toThrow(/Enter an IPv4/);
    expect(() => calculateSubnet('300.1.1.1/24')).toThrow(/not a valid IPv4/);
    expect(() => calculateSubnet('1.2.3.4/33')).toThrow(/between 0 and 32/);
    expect(() => calculateSubnet('1.2.3.4/abc')).toThrow();
    expect(() => calculateSubnet('1.2.3.4 255.0.255.0')).toThrow(/not a valid subnet mask/);
    expect(() => calculateSubnet('::1')).toThrow(/IPv6/);
    expect(() => calculateSubnet('1.2.3/24')).toThrow(/not a valid IPv4/);
  });
});

describe('helpers', () => {
  it('maskToPrefix', () => {
    expect(maskToPrefix('255.255.255.255')).toBe(32);
    expect(maskToPrefix('0.0.0.0')).toBe(0);
    expect(maskToPrefix('255.255.254.0')).toBe(23);
  });
  it('classify', () => {
    expect(classify(parseV4('127.0.0.1'))).toBe('Loopback');
    expect(classify(parseV4('169.254.1.1'))).toContain('Link-local');
    expect(classify(parseV4('100.64.0.1'))).toContain('Carrier');
    expect(classify(parseV4('224.0.0.1'))).toBe('Multicast');
    expect(classify(parseV4('255.255.255.255'))).toBe('Limited broadcast');
    expect(classify(parseV4('1.1.1.1'))).toBe('Public');
  });
  it('splitSubnet', () => {
    expect(splitSubnet('192.168.0.0/24', 26).subnets).toEqual(['192.168.0.0/26', '192.168.0.64/26', '192.168.0.128/26', '192.168.0.192/26']);
    const big = splitSubnet('10.0.0.0/8', 24, 5);
    expect(big.total).toBe(65536n);
    expect(big.subnets).toHaveLength(5);
    expect(() => splitSubnet('10.0.0.0/24', 16)).toThrow(/between \/24 and \/32/);
  });
});
