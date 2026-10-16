import { describe, expect, it } from 'vitest';
import { base64ToBytes, parsePem } from '../_lib/bytes';
import { formatKeyPair, generateRsa } from './logic';

describe('generateRsa', () => {
  it('produces PKCS#8 / SPKI PEM that Web Crypto can re-import and use', async () => {
    const k = await generateRsa({ bits: 2048, use: 'rsa-pkcs1', hash: 'SHA-256' });
    const pem = formatKeyPair(k, 'pem');
    expect(pem).toMatch(/^-----BEGIN PRIVATE KEY-----\n/);
    expect(pem).toContain('-----BEGIN PUBLIC KEY-----');
    const blocks = parsePem(pem);
    expect(blocks.map((b) => b.label)).toEqual(['PRIVATE KEY', 'PUBLIC KEY']);
    const alg = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
    const priv = await crypto.subtle.importKey('pkcs8', blocks[0]!.der, alg, false, ['sign']);
    const pub = await crypto.subtle.importKey('spki', blocks[1]!.der, alg, false, ['verify']);
    const data = new TextEncoder().encode('hello');
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', priv, data);
    expect(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', pub, sig, data)).toBe(true);
  });
  it('produces JWK with the expected fields and 2048-bit modulus', async () => {
    const k = await generateRsa({ bits: 2048, use: 'rsa-oaep', hash: 'SHA-256' });
    expect(k.publicJwk.kty).toBe('RSA');
    expect(k.publicJwk.e).toBe('AQAB');
    expect(base64ToBytes(k.publicJwk.n!).length).toBe(256);
    expect(k.privateJwk.d).toBeTruthy();
    expect(formatKeyPair(k, 'jwk')).toContain('"kty": "RSA"');
  });
  it('rejects unsupported sizes', async () => {
    await expect(generateRsa({ bits: 1024 as 2048, use: 'rsa-oaep', hash: 'SHA-256' })).rejects.toThrow(/2048/);
  });
});
