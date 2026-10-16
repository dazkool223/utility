import { describe, expect, it } from 'vitest';
import { gzipSync } from 'fflate';
import { magic, magicBest, magicReport, detectFileType } from './logic';

const b64 = (s: string) => btoa(s);
const SENTENCE = 'Hello, this is a perfectly normal sentence that was encoded with Base64.';

describe('magic', () => {
  it('decodes Base64 text', () => {
    expect(magicBest(b64(SENTENCE))).toBe(SENTENCE);
    expect(magicReport(b64(SENTENCE))).toContain('Base64');
  });

  it('peels two layers (Base64 of Base64)', () => {
    const { results } = magic(b64(b64(SENTENCE)));
    expect(results[0]!.text).toBe(SENTENCE);
    expect(results[0]!.steps.length).toBe(2);
  });

  it('decodes hex', () => {
    const hex = Array.from(new TextEncoder().encode(SENTENCE), (x) => x.toString(16).padStart(2, '0')).join('');
    expect(magicBest(hex)).toBe(SENTENCE);
  });

  it('decodes gzip inside Base64 and names the steps', () => {
    const gz = gzipSync(new TextEncoder().encode(SENTENCE));
    const text = btoa(String.fromCharCode(...gz));
    const { results } = magic(text);
    expect(results[0]!.text).toBe(SENTENCE);
    expect(results[0]!.steps.join(' ')).toMatch(/Base64.*(Gunzip|gzip)/i);
  });

  it('recognises a binary file type', () => {
    expect(detectFileType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]))).toBe('PNG image');
  });

  it('says so when nothing matches', () => {
    expect(magicReport('just some ordinary words here')).toMatch(/already looks like readable text|No known encoding/);
  });

  it('rejects empty input and bad depth', () => {
    expect(() => magic('   ')).toThrow(/Paste some/);
    expect(() => magic('abc', { maxDepth: 9 })).toThrow(/Depth/);
  });
});
