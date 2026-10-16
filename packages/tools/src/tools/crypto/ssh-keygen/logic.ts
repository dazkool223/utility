import { ToolError } from '@/core/types';
import { base64ToBytes, buf, bytesToBase64, bytesToHex, randomBytes, utf8 } from '../_lib/bytes';

/** SSH wire-format writer (RFC 4251 section 5). */
export class Writer {
  private parts: Uint8Array[] = [];
  u32(n: number): this {
    this.parts.push(new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]));
    return this;
  }
  raw(b: Uint8Array): this {
    this.parts.push(b);
    return this;
  }
  string(b: Uint8Array | string): this {
    const bytes = typeof b === 'string' ? utf8(b) : b;
    return this.u32(bytes.length).raw(bytes);
  }
  /** Multi-precision integer: big-endian, minimal, with a leading zero if the top bit is set. */
  mpint(b: Uint8Array): this {
    let i = 0;
    while (i < b.length && b[i] === 0) i++;
    let v = b.subarray(i);
    if (v.length && v[0]! & 0x80) {
      const t = new Uint8Array(v.length + 1);
      t.set(v, 1);
      v = t;
    }
    return this.string(v);
  }
  bytes(): Uint8Array<ArrayBuffer> {
    const len = this.parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(len);
    let o = 0;
    for (const p of this.parts) {
      out.set(p, o);
      o += p.length;
    }
    return out;
  }
}

export class Reader {
  private o = 0;
  constructor(private b: Uint8Array) {}
  u32(): number {
    if (this.o + 4 > this.b.length) throw new ToolError('The key data is truncated.');
    const v = ((this.b[this.o]! << 24) | (this.b[this.o + 1]! << 16) | (this.b[this.o + 2]! << 8) | this.b[this.o + 3]!) >>> 0;
    this.o += 4;
    return v;
  }
  string(): Uint8Array {
    const n = this.u32();
    if (this.o + n > this.b.length) throw new ToolError('The key data is truncated.');
    const v = this.b.subarray(this.o, this.o + n);
    this.o += n;
    return v;
  }
  done(): boolean {
    return this.o >= this.b.length;
  }
}

const b64Url = (s: string): Uint8Array => base64ToBytes(s);

export interface SshKeyInfo {
  type: string;
  bits: number | null;
  sha256: string;
  md5: string;
  comment: string;
  blob: Uint8Array;
}

export async function fingerprints(blob: Uint8Array): Promise<{ sha256: string; md5: string }> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', buf(blob)));
  const { md5 } = await import('hash-wasm');
  const m = await md5(blob);
  return { sha256: 'SHA256:' + bytesToBase64(d).replace(/=+$/, ''), md5: 'MD5:' + m.replace(/(..)(?!$)/g, '$1:') };
}

/** Parses one OpenSSH public key line ("ssh-ed25519 AAAA... comment") or a bare Base64 blob. */
export async function inspectPublicKey(line: string): Promise<SshKeyInfo> {
  const text = line.trim().split('\n')[0]!.trim();
  if (!text) throw new ToolError('Paste a public key such as "ssh-ed25519 AAAAC3... user@host".');
  const parts = text.split(/\s+/);
  const b64 = /^[A-Za-z0-9+/=]{20,}$/.test(parts[0]!) ? parts[0]! : parts[1];
  if (!b64) throw new ToolError('This does not look like an SSH public key. It should be "type base64 comment".');
  let blob: Uint8Array;
  try {
    blob = base64ToBytes(b64);
  } catch {
    throw new ToolError('The key body is not valid Base64.');
  }
  const r = new Reader(blob);
  const type = new TextDecoder().decode(r.string());
  if (parts[0] !== type && !/^[A-Za-z0-9+/=]{20,}$/.test(parts[0]!)) throw new ToolError(`The key says "${parts[0]}" but its data is a "${type}" key.`);
  let bits: number | null = null;
  if (type === 'ssh-ed25519') bits = 256;
  else if (type === 'ssh-rsa') {
    r.string();
    const n = r.string();
    let i = 0;
    while (i < n.length && n[i] === 0) i++;
    bits = (n.length - i) * 8 - (8 - (32 - Math.clz32(n[i] ?? 1)));
  } else if (type.startsWith('ecdsa-sha2-')) bits = type.endsWith('nistp256') ? 256 : type.endsWith('nistp384') ? 384 : 521;
  else if (!type.startsWith('sk-') && type !== 'ssh-dss') throw new ToolError(`Unsupported key type "${type}".`);
  const fp = await fingerprints(blob);
  const comment = parts[0] === type ? parts.slice(2).join(' ') : parts.slice(1).join(' ');
  return { type, bits, ...fp, comment, blob };
}

export interface SshKeyOptions {
  type: 'ed25519' | 'rsa';
  bits: 2048 | 3072 | 4096;
  comment: string;
}

export interface SshKey {
  privateKey: string;
  publicKey: string;
  sha256: string;
}

function armor(blob: Uint8Array): string {
  const lines = bytesToBase64(blob).match(/.{1,70}/g) ?? [];
  return `-----BEGIN OPENSSH PRIVATE KEY-----\n${lines.join('\n')}\n-----END OPENSSH PRIVATE KEY-----\n`;
}

/** Builds the unencrypted openssh-key-v1 container (PROTOCOL.key). */
export function buildPrivateKey(publicBlob: Uint8Array, privateFields: Writer, comment: string, check = crypto.getRandomValues(new Uint32Array(1))[0]!): string {
  const inner = new Writer().u32(check).u32(check).raw(privateFields.bytes()).string(comment);
  let body = inner.bytes();
  const pad = (8 - (body.length % 8)) % 8;
  if (pad) {
    const padded = new Uint8Array(body.length + pad);
    padded.set(body);
    for (let i = 1; i <= pad; i++) padded[body.length + i - 1] = i;
    body = padded;
  }
  const out = new Writer()
    .raw(utf8('openssh-key-v1\0'))
    .string('none')
    .string('none')
    .string('')
    .u32(1)
    .string(publicBlob)
    .string(body)
    .bytes();
  return armor(out);
}

export async function generateSshKey(o: SshKeyOptions): Promise<SshKey> {
  const comment = o.comment.trim();
  if (/[\r\n]/.test(comment)) throw new ToolError('The comment must be on one line.');
  let publicBlob: Uint8Array;
  let fields: Writer;
  let typeName: string;
  if (o.type === 'ed25519') {
    typeName = 'ssh-ed25519';
    let pair: CryptoKeyPair;
    try {
      pair = (await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])) as CryptoKeyPair;
    } catch {
      throw new ToolError('This browser cannot generate Ed25519 keys yet. Choose RSA instead, or update your browser.');
    }
    const pub = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
    const seed = pkcs8.subarray(pkcs8.length - 32);
    publicBlob = new Writer().string(typeName).string(pub).bytes();
    const priv64 = new Uint8Array(64);
    priv64.set(seed);
    priv64.set(pub, 32);
    fields = new Writer().string(typeName).string(pub).string(priv64);
  } else {
    if (![2048, 3072, 4096].includes(o.bits)) throw new ToolError('RSA key size must be 2048, 3072 or 4096 bits.');
    typeName = 'ssh-rsa';
    const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: o.bits, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
    const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    const [n, e, d, p, q, qi] = [jwk.n, jwk.e, jwk.d, jwk.p, jwk.q, jwk.qi].map((v) => b64Url(v!));
    publicBlob = new Writer().string(typeName).mpint(e!).mpint(n!).bytes();
    fields = new Writer().string(typeName).mpint(n!).mpint(e!).mpint(d!).mpint(qi!).mpint(p!).mpint(q!);
  }
  const fp = await fingerprints(publicBlob);
  return {
    privateKey: buildPrivateKey(publicBlob, fields, comment),
    publicKey: `${typeName} ${bytesToBase64(publicBlob)}${comment ? ' ' + comment : ''}`,
    sha256: fp.sha256,
  };
}

export { bytesToHex, randomBytes };
