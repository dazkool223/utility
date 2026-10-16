import { createCipheriv, pbkdf2Sync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { decryptText, encryptText, type Cipher } from './logic';

const salt = new Uint8Array(16).map((_, i) => i);
const iterations = 2000;

describe('encrypt / decrypt', () => {
  for (const cipher of ['AES-GCM', 'AES-CBC', 'AES-CTR'] as Cipher[]) {
    it(`${cipher} round-trips unicode and empty-ish text`, async () => {
      for (const text of ['hello', 'héllo wörld ✓ 你好 🚀', 'a'.repeat(5000), ' ']) {
        const enc = await encryptText(text, 'pw', { cipher, iterations });
        expect(enc.startsWith(`utl1.${cipher}.${iterations}.`)).toBe(true);
        expect(await decryptText(enc, 'pw')).toBe(text);
      }
    });
    it(`${cipher} rejects a wrong passphrase`, async () => {
      const enc = await encryptText('secret', 'right', { cipher, iterations });
      await expect(decryptText(enc, 'wrong')).rejects.toThrow(/wrong passphrase/);
    });
    it(`${cipher} detects tampering`, async () => {
      const enc = await encryptText('secret message', 'pw', { cipher, iterations });
      const parts = enc.split('.');
      const ct = parts[5]!;
      parts[5] = (ct[0] === 'A' ? 'B' : 'A') + ct.slice(1);
      await expect(decryptText(parts.join('.'), 'pw')).rejects.toThrow(/wrong passphrase/);
    });
  }

  it('matches an independent AES-256-GCM / PBKDF2 implementation (node:crypto)', async () => {
    const iv = new Uint8Array(12).map((_, i) => 100 + i);
    const out = await encryptText('golden', 'pass', { cipher: 'AES-GCM', iterations, salt, iv });
    const key = pbkdf2Sync('pass', salt, iterations, 32, 'sha256') as unknown as Uint8Array;
    const c = createCipheriv('aes-256-gcm', key, iv);
    const parts = [c.update('golden', 'utf8'), c.final(), c.getAuthTag()] as unknown as Uint8Array[];
    expect(out.split('.')[5]).toBe(Buffer.concat(parts).toString('base64url'));
  });

  it('produces different output each time (random salt and IV)', async () => {
    const a = await encryptText('x', 'p', { cipher: 'AES-GCM', iterations });
    const b = await encryptText('x', 'p', { cipher: 'AES-GCM', iterations });
    expect(a).not.toBe(b);
  });

  it('gives plain-language errors for bad input', async () => {
    await expect(encryptText('x', '', { cipher: 'AES-GCM', iterations })).rejects.toThrow(/passphrase/);
    await expect(encryptText('x', 'p', { cipher: 'AES-GCM', iterations: 5 })).rejects.toThrow(/Iterations/);
    await expect(decryptText('hello', 'p')).rejects.toThrow(/not text produced/);
    await expect(decryptText('utl1.AES-GCM.2000.AA.AA', 'p')).rejects.toThrow(/not text produced|incomplete/);
    await expect(decryptText('utl1.AES-XYZ.2000.AA.AA.AA', 'p')).rejects.toThrow(/Unknown cipher/);
    await expect(decryptText('utl1.AES-GCM.99999999999.AA.AA.AA', 'p')).rejects.toThrow(/iteration/);
    await expect(decryptText('utl1.AES-GCM.2000.!!.AA.AA', 'p')).rejects.toThrow(/damaged/);
  });
});
