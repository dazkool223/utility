import { describe, expect, it } from 'vitest';
import { estimateStrength } from './logic';

describe('estimateStrength', () => {
  it('rates common passwords as very weak with feedback', async () => {
    for (const pw of ['password', '123456', 'qwerty123']) {
      const r = await estimateStrength(pw);
      expect(r.score).toBeLessThanOrEqual(1);
      expect(r.warning.length + r.suggestions.length).toBeGreaterThan(0);
    }
  });
  it('rates a long random-looking passphrase as strong', async () => {
    const r = await estimateStrength('vK9#mQ2$xL7!pW4&zR8^tN5');
    expect(r.score).toBe(4);
    expect(r.entropyBits).toBeGreaterThan(60);
    expect(r.crackTimes).toHaveLength(4);
  });
  it('detects dictionary words and sequences', async () => {
    const r = await estimateStrength('correcthorsebatterystaple');
    expect(r.patterns.some((p) => p.startsWith('dictionary'))).toBe(true);
  });
  it('handles unicode and rejects empty / huge input', async () => {
    expect((await estimateStrength('пароль-密码-🔐')).score).toBeGreaterThanOrEqual(0);
    await expect(estimateStrength('')).rejects.toThrow(/Type or paste/);
    await expect(estimateStrength('a'.repeat(300))).rejects.toThrow(/256/);
  });
});
