import { describe, expect, it } from 'vitest';
import { hmac, hmacAll, keyBytes } from './logic';

const enc = (s: string) => new TextEncoder().encode(s);

describe('HMAC golden vectors', () => {
  it('RFC 4231 test case 1 (20 x 0x0b, "Hi There")', async () => {
    const key = new Uint8Array(20).fill(0x0b);
    expect(await hmac('sha256', key, enc('Hi There'))).toBe('b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');
    expect(await hmac('sha512', key, enc('Hi There'))).toBe(
      '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854',
    );
  });
  it('RFC 4231 test case 2 ("Jefe")', async () => {
    const m = enc('what do ya want for nothing?');
    expect(await hmac('sha256', enc('Jefe'), m)).toBe('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
    expect(await hmac('sha384', enc('Jefe'), m)).toBe('af45d2e376484031617f78d2b58a6b1b9c7ef464f5a01b47e42ec3736322445e8e2240ca5e69e2c78b3239ecfab21649');
  });
  it('RFC 4231 test case 6 (key longer than block size)', async () => {
    const key = new Uint8Array(131).fill(0xaa);
    expect(await hmac('sha256', key, enc('Test Using Larger Than Block-Size Key - Hash Key First'))).toBe(
      '60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54',
    );
  });
  it('RFC 2202 MD5 and SHA-1 ("Jefe")', async () => {
    const m = enc('what do ya want for nothing?');
    expect(await hmac('md5', enc('Jefe'), m)).toBe('750c783e6ab0b503eaa86e310a5db738');
    expect(await hmac('sha1', enc('Jefe'), m)).toBe('effcdf6ae5eb2fa2d27416d5f184df9c259a7c79');
  });
  it('supports empty key and message, and lists every algorithm', async () => {
    expect(await hmac('sha256', new Uint8Array(0), new Uint8Array(0))).toBe('b613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad');
    expect((await hmacAll(enc('k'), enc('m'))).length).toBeGreaterThanOrEqual(9);
  });
});

describe('inputs', () => {
  it('parses key formats and rejects bad ones', async () => {
    await expect(hmac('nope', new Uint8Array(), new Uint8Array())).rejects.toThrow(/Unknown/);
    expect(keyBytes('0b0b', 'hex')).toEqual(new Uint8Array([11, 11]));
    expect(keyBytes('CwsL', 'base64')).toEqual(new Uint8Array([11, 11, 11]));
    expect(() => keyBytes('xyz', 'hex')).toThrow(/hex/);
    expect(() => keyBytes('***', 'base64')).toThrow(/Base64/);

  });
});
