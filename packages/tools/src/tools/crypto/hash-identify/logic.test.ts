import { describe, expect, it } from 'vitest';
import { identifyHash } from './logic';

const names = (s: string) => identifyHash(s).map((g) => g.name);

describe('identifyHash', () => {
  it('hex digests by length', () => {
    expect(names('5d41402abc4b2a76b9719d911017c592')[0]).toBe('MD5');
    expect(names('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')).toContain('SHA-1');
    expect(names('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')).toContain('SHA-256');
    expect(names('a'.repeat(128))).toContain('SHA-512');
    expect(names('a'.repeat(96))).toContain('SHA-384');
    expect(names('deadbeef')).toContain('CRC-32');
  });
  it('password hashes by prefix', () => {
    expect(names('$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')[0]).toBe('bcrypt');
    expect(names('$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObG')[0]).toBe('Argon2');
    expect(names('$6$salt$abcdef')[0]).toBe('SHA-512 crypt');
    expect(names('*2470C0C06DEE42FD1618BB99005ADCA2EC9D1E19')[0]).toContain('MySQL');
    expect(names('$P$B12345678901234567890123456789a')[0]).toBe('phpass');
  });
  it('Base64 digests', () => {
    expect(names('XUFAKrxLKna5cZnPeOVPJA==')[0]).toContain('MD5');
    expect(names('n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=')[0]).toContain('SHA-256');
  });
  it('trims whitespace and handles uppercase', () => {
    expect(names('  5D41402ABC4B2A76B9719D911017C592\n')).toContain('MD5');
  });
  it('rejects empty, multi-word and unknown input', () => {
    expect(() => identifyHash('')).toThrow(/Paste a hash/);
    expect(() => identifyHash('two words')).toThrow(/no spaces/);
    expect(() => identifyHash('!!!')).toThrow(/does not look like/);
  });
  it('unknown hex length gets a hint, not a wrong guess', () => {
    expect(names('abcdef0123')[0]).toBe('Unknown hex digest');
  });
});
