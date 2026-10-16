import { ToolError } from '@/core/types';

// openpgp.js is LGPL-3.0. It is only ever loaded through this dynamic import(), so the bundler keeps it as a separate,
// unmodified chunk that can be replaced. Do not import it statically anywhere else.
const pgp = () => import('openpgp');

export type Curve = 'curve25519' | 'nistP256' | 'rsa3072';

function wrap(e: unknown, fallback: string): never {
  if (e instanceof ToolError) throw e;
  const m = e instanceof Error ? e.message : String(e);
  if (/passphrase|decrypt/i.test(m) && /incorrect|wrong|invalid/i.test(m)) throw new ToolError('Wrong passphrase for this key.');
  throw new ToolError(`${fallback} (${m.replace(/^Error: /, '')})`);
}

export function parseUserId(s: string): { name: string; email?: string } {
  const t = s.trim();
  if (!t) throw new ToolError('Enter a user ID such as "Alice <alice@example.com>" in the input box.');
  const m = /^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/.exec(t);
  if (m) return { name: m[1]!.trim(), email: m[2] };
  if (/^[^<>\s]+@[^<>\s]+$/.test(t)) return { name: '', email: t };
  return { name: t };
}

export async function generateKeyPair(userId: string, curve: Curve, passphrase: string): Promise<string> {
  const id = parseUserId(userId);
  try {
    const o = await pgp();
    const common = { userIDs: [id], passphrase: passphrase || undefined, format: 'armored' as const };
    const r = curve === 'rsa3072' ? await o.generateKey({ ...common, type: 'rsa', rsaBits: 3072 }) : await o.generateKey({ ...common, type: 'ecc', curve: curve === 'nistP256' ? 'nistP256' : 'curve25519Legacy' });
    return `${r.publicKey}\n${r.privateKey}\n${r.revocationCertificate}`;
  } catch (e) {
    return wrap(e, 'Could not generate the key');
  }
}

async function readPublic(armored: string) {
  const o = await pgp();
  if (!armored.trim()) throw new ToolError('Paste the recipient\'s PGP public key in the key box.');
  try {
    return await o.readKey({ armoredKey: armored.trim() });
  } catch {
    throw new ToolError('The key is not a valid armored PGP key (it should start with -----BEGIN PGP PUBLIC KEY BLOCK-----).');
  }
}

async function readPrivate(armored: string, passphrase: string) {
  const o = await pgp();
  if (!armored.trim()) throw new ToolError('Paste your PGP private key in the key box.');
  let key;
  try {
    key = await o.readPrivateKey({ armoredKey: armored.trim() });
  } catch {
    throw new ToolError('The key is not a valid armored PGP private key (it should start with -----BEGIN PGP PRIVATE KEY BLOCK-----).');
  }
  if (key.isDecrypted()) return key;
  if (!passphrase) throw new ToolError('This private key is protected. Enter its passphrase.');
  try {
    return await o.decryptKey({ privateKey: key, passphrase });
  } catch {
    throw new ToolError('Wrong passphrase for this key.');
  }
}

export async function encryptMessage(text: string, publicKey: string, password: string): Promise<string> {
  if (!text) throw new ToolError('Enter the message to encrypt.');
  const o = await pgp();
  try {
    const message = await o.createMessage({ text });
    if (password) return (await o.encrypt({ message, passwords: [password], format: 'armored' })) as string;
    const encryptionKeys = await readPublic(publicKey);
    return (await o.encrypt({ message, encryptionKeys, format: 'armored' })) as string;
  } catch (e) {
    return wrap(e, 'Could not encrypt');
  }
}

export async function decryptMessage(armoredMessage: string, privateKey: string, keyPassphrase: string, password: string): Promise<string> {
  const o = await pgp();
  let message;
  try {
    message = await o.readMessage({ armoredMessage: armoredMessage.trim() });
  } catch {
    throw new ToolError('The message is not a valid armored PGP message (it should start with -----BEGIN PGP MESSAGE-----).');
  }
  try {
    if (password) {
      const r = await o.decrypt({ message, passwords: [password] });
      return String(r.data);
    }
    const decryptionKeys = await readPrivate(privateKey, keyPassphrase);
    const r = await o.decrypt({ message, decryptionKeys });
    return String(r.data);
  } catch (e) {
    if (e instanceof ToolError) throw e;
    const m = e instanceof Error ? e.message : String(e);
    if (/session key|decrypt|password|key/i.test(m)) throw new ToolError('Could not decrypt: this key or password does not match the message.');
    return wrap(e, 'Could not decrypt');
  }
}

export async function signMessage(text: string, privateKey: string, keyPassphrase: string): Promise<string> {
  if (!text) throw new ToolError('Enter the message to sign.');
  const o = await pgp();
  const signingKeys = await readPrivate(privateKey, keyPassphrase);
  try {
    const message = await o.createCleartextMessage({ text });
    return (await o.sign({ message, signingKeys, format: 'armored' })) as string;
  } catch (e) {
    return wrap(e, 'Could not sign');
  }
}

export async function verifyMessage(armoredSigned: string, publicKey: string): Promise<string> {
  const o = await pgp();
  let message;
  try {
    message = await o.readCleartextMessage({ cleartextMessage: armoredSigned.trim() });
  } catch {
    throw new ToolError('This is not a PGP cleartext signed message (it should start with -----BEGIN PGP SIGNED MESSAGE-----).');
  }
  const verificationKeys = await readPublic(publicKey);
  const r = await o.verify({ message, verificationKeys });
  const sig = r.signatures[0];
  if (!sig) throw new ToolError('The message carries no signature.');
  try {
    await sig.verified;
  } catch {
    return `INVALID SIGNATURE: the message was changed, or the key does not match.\n\n${message.getText()}`;
  }
  return `Valid signature from key ${sig.keyID.toHex().toUpperCase()}.\n\n${message.getText()}`;
}
