import { beforeAll, describe, expect, it } from 'vitest';
import { decryptMessage, encryptMessage, generateKeyPair, parseUserId, signMessage, verifyMessage } from './logic';

let pub = '';
let priv = '';
let protectedPriv = '';

function split(all: string) {
  const publicKey = /-----BEGIN PGP PUBLIC KEY BLOCK-----[\s\S]*?-----END PGP PUBLIC KEY BLOCK-----/.exec(all)![0];
  const privateKey = /-----BEGIN PGP PRIVATE KEY BLOCK-----[\s\S]*?-----END PGP PRIVATE KEY BLOCK-----/.exec(all)![0];
  return { publicKey, privateKey };
}

beforeAll(async () => {
  const a = split(await generateKeyPair('Alice <alice@example.com>', 'curve25519', ''));
  pub = a.publicKey;
  priv = a.privateKey;
  protectedPriv = split(await generateKeyPair('Bob <bob@example.com>', 'curve25519', 'hunter2')).privateKey;
}, 30_000);

describe('PGP', () => {
  it('generates armored key pairs', () => {
    expect(pub).toContain('BEGIN PGP PUBLIC KEY BLOCK');
    expect(priv).toContain('BEGIN PGP PRIVATE KEY BLOCK');
  });
  it('encrypts to a public key and decrypts with the private key (unicode safe)', async () => {
    const msg = 'Héllo wörld ✓\nline two';
    const enc = await encryptMessage(msg, pub, '');
    expect(enc).toContain('BEGIN PGP MESSAGE');
    expect(await decryptMessage(enc, priv, '', '')).toBe(msg);
  });
  it('passphrase-only (symmetric) encryption round-trips', async () => {
    const enc = await encryptMessage('secret', '', 'pw');
    expect(await decryptMessage(enc, '', '', 'pw')).toBe('secret');
    await expect(decryptMessage(enc, '', '', 'wrong')).rejects.toThrow(/Could not decrypt/);
  });
  it('protected private keys need the right passphrase', async () => {
    const bobPub = split(await generateKeyPair('Bob <bob@example.com>', 'curve25519', '')).publicKey;
    void bobPub;
    await expect(signMessage('x', protectedPriv, '')).rejects.toThrow(/passphrase/);
    await expect(signMessage('x', protectedPriv, 'nope')).rejects.toThrow(/Wrong passphrase/);
    expect(await signMessage('x', protectedPriv, 'hunter2')).toContain('BEGIN PGP SIGNED MESSAGE');
  });
  it('signs and verifies, and detects tampering', async () => {
    const signed = await signMessage('Approved', priv, '');
    const ok = await verifyMessage(signed, pub);
    expect(ok).toMatch(/^Valid signature/);
    expect(ok).toContain('Approved');
    const bad = await verifyMessage(signed.replace('Approved', 'Rejected'), pub);
    expect(bad).toMatch(/^INVALID SIGNATURE/);
  });
  it('the wrong key cannot decrypt', async () => {
    const other = split(await generateKeyPair('Eve <eve@example.com>', 'curve25519', '')).privateKey;
    const enc = await encryptMessage('hi', pub, '');
    await expect(decryptMessage(enc, other, '', '')).rejects.toThrow(/does not match/);
  });
  it('gives plain errors for malformed input', async () => {
    await expect(encryptMessage('', pub, '')).rejects.toThrow(/Enter the message/);
    await expect(encryptMessage('hi', '', '')).rejects.toThrow(/public key/);
    await expect(encryptMessage('hi', 'junk', '')).rejects.toThrow(/not a valid armored/);
    await expect(decryptMessage('junk', priv, '', '')).rejects.toThrow(/not a valid armored PGP message/);
    await expect(verifyMessage('junk', pub)).rejects.toThrow(/cleartext signed/);
    await expect(generateKeyPair('', 'curve25519', '')).rejects.toThrow(/user ID/);
  });
});

describe('parseUserId', () => {
  it('splits name and e-mail', () => {
    expect(parseUserId('Alice Smith <a@b.co>')).toEqual({ name: 'Alice Smith', email: 'a@b.co' });
    expect(parseUserId('a@b.co')).toEqual({ name: '', email: 'a@b.co' });
    expect(parseUserId('Just A Name')).toEqual({ name: 'Just A Name' });
  });
});
