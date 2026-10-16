import { ToolError } from '@/core/types';

export interface HashGuess {
  name: string;
  /** Short note: where it is used or why it is ambiguous. */
  note: string;
}

const HEX_BY_LENGTH: Record<number, HashGuess[]> = {
  8: [
    { name: 'CRC-32', note: 'checksum, not a cryptographic hash' },
    { name: 'Adler-32', note: 'checksum, not a cryptographic hash' },
    { name: 'xxHash32', note: 'fast non-cryptographic hash' },
  ],
  16: [
    { name: 'xxHash64', note: 'fast non-cryptographic hash' },
    { name: 'MySQL (pre-4.1) OLD_PASSWORD', note: 'legacy' },
    { name: 'Half MD5', note: 'first 16 hex digits of an MD5' },
  ],
  32: [
    { name: 'MD5', note: 'broken for security; common for checksums' },
    { name: 'NTLM', note: 'Windows password hash (MD4 of UTF-16LE)' },
    { name: 'MD4', note: 'broken' },
    { name: 'LM', note: 'legacy Windows password hash' },
    { name: 'xxHash128', note: 'fast non-cryptographic hash' },
    { name: 'MD2', note: 'obsolete' },
  ],
  40: [
    { name: 'SHA-1', note: 'broken for signatures; used by Git' },
    { name: 'RIPEMD-160', note: 'used in Bitcoin addresses' },
    { name: 'MySQL5 (without leading *)', note: 'SHA-1 of SHA-1' },
  ],
  48: [{ name: 'Tiger-192', note: 'rare' }],
  56: [
    { name: 'SHA-224', note: 'truncated SHA-256 variant' },
    { name: 'SHA3-224', note: 'Keccak-based' },
  ],
  64: [
    { name: 'SHA-256', note: 'most common modern hash' },
    { name: 'SHA3-256', note: 'Keccak-based' },
    { name: 'BLAKE2s-256', note: 'fast hash' },
    { name: 'BLAKE3', note: 'default 256-bit output' },
    { name: 'Keccak-256', note: 'used by Ethereum' },
    { name: 'RIPEMD-256', note: 'rare' },
  ],
  80: [{ name: 'RIPEMD-320', note: 'rare' }],
  96: [
    { name: 'SHA-384', note: 'truncated SHA-512 variant' },
    { name: 'SHA3-384', note: 'Keccak-based' },
  ],
  128: [
    { name: 'SHA-512', note: 'strong, 512-bit' },
    { name: 'SHA3-512', note: 'Keccak-based' },
    { name: 'BLAKE2b-512', note: 'fast hash' },
    { name: 'Whirlpool', note: '512-bit' },
    { name: 'Keccak-512', note: 'Keccak (pre-NIST) variant' },
  ],
};

const B64_BY_LENGTH: Record<number, string> = { 24: 'MD5 (16 bytes)', 28: 'SHA-1 (20 bytes)', 44: 'SHA-256 (32 bytes)', 64: 'SHA-384 (48 bytes)', 88: 'SHA-512 (64 bytes)' };

interface Prefix {
  re: RegExp;
  name: string;
  note: string;
}

const PREFIXES: Prefix[] = [
  { re: /^\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}$/, name: 'bcrypt', note: 'adaptive password hash; cost is the number after the version' },
  { re: /^\$argon2(id|i|d)\$/, name: 'Argon2', note: 'memory-hard password hash (winner of the Password Hashing Competition)' },
  { re: /^\$scrypt\$|^\$7\$/, name: 'scrypt', note: 'memory-hard password hash' },
  { re: /^\$6\$/, name: 'SHA-512 crypt', note: 'Unix crypt(3), $6$' },
  { re: /^\$5\$/, name: 'SHA-256 crypt', note: 'Unix crypt(3), $5$' },
  { re: /^\$1\$/, name: 'MD5 crypt', note: 'Unix crypt(3), $1$ (weak)' },
  { re: /^\$apr1\$/, name: 'Apache MD5 (apr1)', note: 'htpasswd' },
  { re: /^\$[PH]\$[./0-9A-Za-z]{31}$/, name: 'phpass', note: 'WordPress, phpBB3, Joomla' },
  { re: /^pbkdf2_sha(256|1)\$\d+\$/, name: 'Django PBKDF2', note: 'format: algorithm$iterations$salt$hash' },
  { re: /^\{SSHA\}/, name: 'LDAP salted SHA-1', note: 'Base64 of SHA-1 + salt' },
  { re: /^\{SHA\}/, name: 'LDAP SHA-1', note: 'Base64 of SHA-1' },
  { re: /^\*[0-9A-F]{40}$/, name: 'MySQL 4.1+ (mysql_native_password)', note: 'SHA-1 of SHA-1, uppercase hex with leading *' },
  { re: /^sha1\$[^$]+\$[0-9a-f]{40}$/, name: 'Django SHA-1', note: 'legacy Django format' },
  { re: /^\$pbkdf2-sha(1|256|512)\$/, name: 'PBKDF2 (Passlib)', note: 'Passlib modular crypt format' },
  { re: /^[0-9a-f]{32}:[0-9a-zA-Z./+=_-]+$/, name: 'MD5 with salt', note: 'hash:salt' },
  { re: /^[0-9a-f]{64}:[0-9a-zA-Z./+=_-]+$/, name: 'SHA-256 with salt', note: 'hash:salt' },
];

export function identifyHash(input: string): HashGuess[] {
  const s = input.trim();
  if (!s) throw new ToolError('Paste a hash to identify.');
  if (/\s/.test(s)) throw new ToolError('A hash has no spaces. Paste just one hash.');
  const out: HashGuess[] = [];
  for (const p of PREFIXES) if (p.re.test(s)) out.push({ name: p.name, note: p.note });
  if (/^[0-9a-fA-F]+$/.test(s)) {
    const list = HEX_BY_LENGTH[s.length];
    if (list) out.push(...list);
    else if (!out.length) out.push({ name: 'Unknown hex digest', note: `${s.length} hex digits (${s.length * 4} bits) does not match a common hash` });
    if (s.length === 32 && s === s.toUpperCase() && /[A-F]/.test(s)) out.unshift({ name: 'NTLM', note: 'NTLM hashes are often written in uppercase' });
  } else if (/^[A-Za-z0-9+/]+={0,2}$/.test(s) && B64_BY_LENGTH[s.length]) {
    out.push({ name: `${B64_BY_LENGTH[s.length]} in Base64`, note: 'a hash encoded as Base64 instead of hex' });
  } else if (/^[A-Za-z0-9_-]+$/.test(s) && s.length === 43) {
    out.push({ name: 'SHA-256 in Base64URL', note: 'a 32-byte value without padding' });
  }
  if (!out.length) throw new ToolError('This does not look like a known hash format. Check for extra characters or a truncated value.');
  return out;
}
