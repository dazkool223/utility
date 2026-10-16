import { describe, expect, it } from 'vitest';
import { formatDigest, hashAll, inputBytes } from './logic';

const enc = (s: string) => new TextEncoder().encode(s);
const get = async (s: string, id: string) => (await hashAll(enc(s))).find((r) => r.id === id)!.hex;

describe('hashAll known vectors', () => {
  it('abc (FIPS 180 / RFC 1321 / RFC 3174)', async () => {
    expect(await get('abc', 'md5')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(await get('abc', 'sha1')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(await get('abc', 'sha224')).toBe('23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7');
    expect(await get('abc', 'sha256')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await get('abc', 'sha384')).toBe(
      'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
    );
    expect(await get('abc', 'sha512')).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    );
  });
  it('SHA-3, Keccak, RIPEMD-160', async () => {
    expect(await get('abc', 'sha3-256')).toBe('3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532');
    expect(await get('', 'sha3-256')).toBe('a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a');
    expect(await get('', 'keccak-256')).toBe('c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
    expect(await get('abc', 'ripemd160')).toBe('8eb208f7e05d987a9b044a8e98c6b087f15a0bfc');
  });
  it('BLAKE2 / BLAKE3 / xxHash', async () => {
    expect(await get('abc', 'blake2b')).toBe(
      'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923',
    );
    expect(await get('abc', 'blake2s')).toBe('508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982');
    expect(await get('', 'blake3')).toBe('af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262');
    expect(await get('', 'xxh32')).toBe('02cc5d05');
    expect(await get('', 'xxh64')).toBe('ef46db3751d8e999');
  });
  it('handles empty and unicode input', async () => {
    expect(await get('', 'sha256')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(await get('héllo ✓', 'md5')).toHaveLength(32);
  });
});

describe('formatting', () => {
  it('formats digests', () => {
    expect(formatDigest('ab12', 'HEX')).toBe('AB12');
    expect(formatDigest('ab12', 'base64')).toBe('qxI=');
  });
  it('parses hex and base64 input, rejects malformed', () => {
    expect(inputBytes('00 ff', 'hex')).toEqual(new Uint8Array([0, 255]));
    expect(inputBytes('AAE=', 'base64')).toEqual(new Uint8Array([0, 1]));
    expect(() => inputBytes('zz', 'hex')).toThrow(/hex/);
    expect(() => inputBytes('@@@', 'base64')).toThrow(/Base64/);
  });
});
