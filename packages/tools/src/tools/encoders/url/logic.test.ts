import { describe, expect, it } from 'vitest';
import { decodeUrl, encodeUrl } from './logic';

describe('URL encode', () => {
  it('encodes a component', () => {
    expect(encodeUrl('a b&c=d/é', 'component')).toBe('a%20b%26c%3Dd%2F%C3%A9');
  });
  it('keeps URL structure in full mode', () => {
    expect(encodeUrl('https://x.com/a b?q=é&r=1', 'full')).toBe('https://x.com/a%20b?q=%C3%A9&r=1');
  });
  it('uses + for spaces in form mode', () => {
    expect(encodeUrl('a b&c', 'form')).toBe('a+b%26c');
  });
  it('decodes in each mode', () => {
    expect(decodeUrl('a%20b%26c%3Dd%2F%C3%A9', 'component')).toBe('a b&c=d/é');
    expect(decodeUrl('a+b%26c', 'form')).toBe('a b&c');
    expect(decodeUrl('https://x.com/a%20b%2Fc', 'full')).toBe('https://x.com/a b%2Fc');
    expect(decodeUrl('a+b', 'component')).toBe('a+b');
  });
  it('handles emoji, empty and multi-line text', () => {
    expect(decodeUrl(encodeUrl('🙂\nx', 'component'), 'component')).toBe('🙂\nx');
    expect(encodeUrl('', 'component')).toBe('');
  });
  it('rejects malformed input', () => {
    expect(() => decodeUrl('%E0%A4%A', 'component')).toThrow(/not valid URL encoding/);
    expect(() => decodeUrl('100%', 'component')).toThrow(/not valid/);
    expect(() => encodeUrl('\ud800', 'component')).toThrow(/lone surrogate/);
  });
  it('handles large input', () => {
    const s = 'a b/é'.repeat(200_000);
    expect(decodeUrl(encodeUrl(s, 'component'), 'component')).toBe(s);
  });
});
