import { describe, expect, it } from 'vitest';
import { comparePassword, hashInfo, hashPassword, passwordBytes, truncates } from './logic';

describe('bcrypt', () => {
  it('verifies the crypt_blowfish reference vector', async () => {
    expect(await comparePassword('U*U', '$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW')).toBe(true);
    expect(await comparePassword('U*V', '$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW')).toBe(false);
  });
  it('hashes and compares round-trip, with a random salt', async () => {
    const a = await hashPassword('hunter2', 4);
    const b = await hashPassword('hunter2', 4);
    expect(a).toMatch(/^\$2[ab]\$04\$/);
    expect(a).not.toBe(b);
    expect(await comparePassword('hunter2', a)).toBe(true);
    expect(await comparePassword('hunter3', a)).toBe(false);
  });
  it('handles unicode passwords', async () => {
    const h = await hashPassword('pässwörd ✓', 4);
    expect(await comparePassword('pässwörd ✓', h)).toBe(true);
  });
  it('rejects bad input in plain language', async () => {
    await expect(hashPassword('', 10)).rejects.toThrow(/Enter a password/);
    await expect(hashPassword('x', 3)).rejects.toThrow(/Cost/);
    await expect(hashPassword('x', 40)).rejects.toThrow(/Cost/);
    await expect(comparePassword('x', 'not-a-hash')).rejects.toThrow(/not a bcrypt hash/);
  });
  it('detects the 72-byte limit by bytes, not characters', () => {
    expect(truncates('a'.repeat(72))).toBe(false);
    expect(truncates('a'.repeat(73))).toBe(true);
    expect(passwordBytes('é'.repeat(37))).toBe(74);
    expect(truncates('é'.repeat(37))).toBe(true);
  });
  it('reads version and cost from a hash', () => {
    expect(hashInfo('$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW')).toEqual({ version: '2a', cost: 5 });
    expect(hashInfo('nope')).toBeNull();
  });
});
