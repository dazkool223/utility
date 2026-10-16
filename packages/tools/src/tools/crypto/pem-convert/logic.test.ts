import { createPrivateKey, createPublicKey } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { base64ToBytes, bytesToHex, toPem } from '../_lib/bytes';
import { derToPem, detectDerEncoding, detectKey, jwkToPem, pemToDer } from './logic';

async function keyPair(alg: RsaHashedKeyGenParams | EcKeyGenParams | { name: string }) {
  const pair = (await crypto.subtle.generateKey(alg as never, true, ['sign', 'verify'])) as CryptoKeyPair;
  return {
    spki: toPem('PUBLIC KEY', new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey))),
    pkcs8: toPem('PRIVATE KEY', new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey))),
    pubJwk: await crypto.subtle.exportKey('jwk', pair.publicKey),
    privJwk: await crypto.subtle.exportKey('jwk', pair.privateKey),
  };
}

const jwkOf = (out: string) => JSON.parse(out.slice(out.indexOf('JWK:') + 4));

describe('PEM -> DER + JWK', () => {
  it('RSA SPKI and PKCS#8', async () => {
    const k = await keyPair({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' });
    const pub = await pemToDer(k.spki);
    expect(pub).toContain('# PUBLIC KEY');
    expect(jwkOf(pub)).toMatchObject({ kty: 'RSA', n: k.pubJwk.n, e: 'AQAB' });
    const priv = await pemToDer(k.pkcs8);
    expect(jwkOf(priv)).toMatchObject({ kty: 'RSA', n: k.privJwk.n, d: k.privJwk.d, p: k.privJwk.p });
    expect(priv).toMatch(/DER \(hex\): 30/);
  });
  it('EC P-256 and P-384', async () => {
    for (const namedCurve of ['P-256', 'P-384']) {
      const k = await keyPair({ name: 'ECDSA', namedCurve });
      expect(jwkOf(await pemToDer(k.spki))).toMatchObject({ kty: 'EC', crv: namedCurve, x: k.pubJwk.x, y: k.pubJwk.y });
      expect(jwkOf(await pemToDer(k.pkcs8)).d).toBe(k.privJwk.d);
    }
  });
  it('Ed25519', async () => {
    const k = await keyPair({ name: 'Ed25519' });
    expect(jwkOf(await pemToDer(k.spki))).toMatchObject({ kty: 'OKP', crv: 'Ed25519', x: k.pubJwk.x });
  });
  it('PKCS#1 RSA keys are wrapped and converted', async () => {
    const k = await keyPair({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' });
    const pkcs1Priv = createPrivateKey(k.pkcs8).export({ type: 'pkcs1', format: 'pem' }) as string;
    const pkcs1Pub = createPublicKey(k.spki).export({ type: 'pkcs1', format: 'pem' }) as string;
    expect(pkcs1Priv).toContain('BEGIN RSA PRIVATE KEY');
    expect(jwkOf(await pemToDer(pkcs1Priv))).toMatchObject({ n: k.privJwk.n, d: k.privJwk.d });
    expect(jwkOf(await pemToDer(pkcs1Pub))).toMatchObject({ n: k.pubJwk.n });
  });
  it('certificates and CSRs only get DER (no JWK)', async () => {
    const out = await pemToDer('-----BEGIN CERTIFICATE-----\nMAMCAQA=\n-----END CERTIFICATE-----');
    expect(out).toContain('# CERTIFICATE (5 bytes)');
    expect(out).not.toContain('JWK');
  });
  it('rejects text without PEM and unknown key types', async () => {
    await expect(pemToDer('hello')).rejects.toThrow(/No PEM block/);
    await expect(pemToDer('-----BEGIN PUBLIC KEY-----\nMAMCAQA=\n-----END PUBLIC KEY-----')).rejects.toThrow(/not supported/);
  });
});

describe('JWK -> PEM round trip', () => {
  it('RSA, EC and Ed25519 private and public keys', async () => {
    const cases = [
      await keyPair({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }),
      await keyPair({ name: 'ECDSA', namedCurve: 'P-256' }),
      await keyPair({ name: 'Ed25519' }),
    ];
    for (const k of cases) {
      expect(await jwkToPem(JSON.stringify(k.pubJwk))).toBe(k.spki);
      expect(await jwkToPem(JSON.stringify(k.privJwk))).toBe(k.pkcs8);
    }
  });
  it('rejects bad JWKs', async () => {
    await expect(jwkToPem('{oops')).rejects.toThrow(/not valid JSON/);
    await expect(jwkToPem('{}')).rejects.toThrow(/kty/);
    await expect(jwkToPem('{"kty":"oct","k":"AA"}')).rejects.toThrow(/Unsupported/);
    await expect(jwkToPem('{"kty":"RSA","e":"AQAB"}')).rejects.toThrow(/could not be imported/);
  });
});

describe('DER -> PEM', () => {
  it('converts hex and Base64 DER', () => {
    expect(derToPem('30 03 02 01 00', 'PUBLIC KEY')).toBe('-----BEGIN PUBLIC KEY-----\nMAMCAQA=\n-----END PUBLIC KEY-----');
    expect(derToPem('MAMCAQA=', 'CERTIFICATE')).toContain('BEGIN CERTIFICATE');
    expect(bytesToHex(base64ToBytes('MAMCAQA='))).toBe('3003020100');
  });
  it('wraps long DER at 64 columns', () => {
    const hex = '3082' + '0100' + '00'.repeat(256);
    const lines = derToPem(hex, 'CERTIFICATE').split('\n');
    expect(lines[1]!.length).toBe(64);
  });
  it('rejects non-DER and empty input', () => {
    expect(() => derToPem('', 'CERTIFICATE')).toThrow(/Paste DER/);
    expect(() => derToPem('AAAA', 'CERTIFICATE')).toThrow(/not DER/);
    expect(() => derToPem('@@@', 'CERTIFICATE')).toThrow();
  });
  it('detects the encoding', () => {
    expect(detectDerEncoding('30820122')).toBe('hex');
    expect(detectDerEncoding('MIIBIjAN')).toBe('base64');
  });
  it('detectKey is null for junk', () => {
    expect(detectKey(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

import meta from './meta';
describe('example', () => {
  it('the sample key converts', async () => {
    expect(await pemToDer(meta.example!.input)).toContain(meta.example!.expect);
  });
});
