import { describe, expect, it } from 'vitest';
import { base64ToBytes } from '../_lib/bytes';
import { Reader, Writer, generateSshKey, inspectPublicKey } from './logic';

const GITHUB_ED25519 = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl';

describe('inspectPublicKey', () => {
  it("matches GitHub's published Ed25519 host key fingerprint", async () => {
    const k = await inspectPublicKey(GITHUB_ED25519);
    expect(k.type).toBe('ssh-ed25519');
    expect(k.bits).toBe(256);
    expect(k.sha256).toBe('SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU');
    expect(k.md5).toMatch(/^MD5:([0-9a-f]{2}:){15}[0-9a-f]{2}$/);
  });
  it('keeps the comment and accepts a bare Base64 blob', async () => {
    expect((await inspectPublicKey(GITHUB_ED25519 + ' me@laptop')).comment).toBe('me@laptop');
    const bare = await inspectPublicKey(GITHUB_ED25519.split(' ')[1]!);
    expect(bare.type).toBe('ssh-ed25519');
  });
  it('rejects malformed keys', async () => {
    await expect(inspectPublicKey('')).rejects.toThrow(/Paste a public key/);
    await expect(inspectPublicKey('hello world')).rejects.toThrow();
    await expect(inspectPublicKey('ssh-rsa AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl')).rejects.toThrow(/data is a/);
    await expect(inspectPublicKey('ssh-ed25519 AAAAC3Nz')).rejects.toThrow();
  });
});

describe('wire format', () => {
  it('mpint adds a leading zero when the top bit is set and strips redundant zeros', () => {
    expect(Array.from(new Writer().mpint(new Uint8Array([0x80])).bytes())).toEqual([0, 0, 0, 2, 0, 0x80]);
    expect(Array.from(new Writer().mpint(new Uint8Array([0, 0, 0x7f])).bytes())).toEqual([0, 0, 0, 1, 0x7f]);
    expect(Array.from(new Writer().string('ab').bytes())).toEqual([0, 0, 0, 2, 97, 98]);
  });
  it('reader reads back what the writer wrote and detects truncation', () => {
    const r = new Reader(new Writer().string('hello').u32(7).bytes());
    expect(new TextDecoder().decode(r.string())).toBe('hello');
    expect(r.u32()).toBe(7);
    expect(r.done()).toBe(true);
    expect(() => new Reader(new Uint8Array([0, 0, 0, 9, 1])).string()).toThrow(/truncated/);
  });
});

function parsePrivate(pem: string) {
  const body = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s/g, '');
  const bytes = base64ToBytes(body);
  const magic = new TextDecoder().decode(bytes.subarray(0, 15));
  const r = new Reader(bytes.subarray(15));
  const cipher = new TextDecoder().decode(r.string());
  const kdf = new TextDecoder().decode(r.string());
  r.string();
  const n = r.u32();
  const pub = r.string();
  const priv = r.string();
  return { magic, cipher, kdf, n, pub, priv };
}

describe('generateSshKey', () => {
  it('Ed25519: valid container, matching public blob, 8-byte padded private section', async () => {
    const k = await generateSshKey({ type: 'ed25519', bits: 2048, comment: 'test@utility' });
    expect(k.privateKey).toMatch(/^-----BEGIN OPENSSH PRIVATE KEY-----\n/);
    expect(k.privateKey.trimEnd().endsWith('-----END OPENSSH PRIVATE KEY-----')).toBe(true);
    const p = parsePrivate(k.privateKey);
    expect(p.magic).toBe('openssh-key-v1\0');
    expect([p.cipher, p.kdf, p.n]).toEqual(['none', 'none', 1]);
    expect(p.priv.length % 8).toBe(0);
    const pubLine = await inspectPublicKey(k.publicKey);
    expect(pubLine.comment).toBe('test@utility');
    expect(Array.from(pubLine.blob)).toEqual(Array.from(p.pub));
    expect(pubLine.sha256).toBe(k.sha256);
    // private section: check1 == check2, then key type
    const r = new Reader(p.priv);
    expect(r.u32()).toBe(r.u32());
    expect(new TextDecoder().decode(r.string())).toBe('ssh-ed25519');
    r.string();
    expect(r.string().length).toBe(64);
  });
  it('RSA 2048: public key reports 2048 bits and the private container parses', async () => {
    const k = await generateSshKey({ type: 'rsa', bits: 2048, comment: '' });
    const info = await inspectPublicKey(k.publicKey);
    expect(info.type).toBe('ssh-rsa');
    expect(info.bits).toBe(2048);
    expect(parsePrivate(k.privateKey).priv.length % 8).toBe(0);
    expect(k.publicKey.split(' ')).toHaveLength(2);
  });
  it('rejects multi-line comments and bad RSA sizes', async () => {
    await expect(generateSshKey({ type: 'ed25519', bits: 2048, comment: 'a\nb' })).rejects.toThrow(/one line/);
    await expect(generateSshKey({ type: 'rsa', bits: 1024 as 2048, comment: '' })).rejects.toThrow(/2048/);
  });
});
