import { describe, expect, it } from 'vitest';
import { makePdf } from '../_lib/testPdf';
import { parsePdfDate, readPdfStringEntry, validateSignatures } from './logic';

describe('validateSignatures', () => {
  it('reports no signatures in an unsigned PDF', async () => {
    const r = await validateSignatures(await makePdf(2));
    expect(r.signatures).toEqual([]);
    expect(r.fileSize).toBeGreaterThan(100);
  });

  it('rejects files that are not PDFs', async () => {
    await expect(validateSignatures(new TextEncoder().encode('hello world'))).rejects.toThrow(/not a valid PDF/);
  });

  it('flags a signature dictionary whose contents cannot be read', async () => {
    const bytes = new TextEncoder().encode('%PDF-1.7\n1 0 obj << /Type /Sig /ByteRange [0 10 20 5] /Contents <00> >> endobj\n%%EOF');
    const r = await validateSignatures(bytes);
    expect(r.signatures).toHaveLength(1);
    expect(r.signatures[0]!.verdict).not.toBe('valid');
  });
});

describe('readPdfStringEntry', () => {
  it('reads literal strings with escapes and nesting', () => {
    expect(readPdfStringEntry('/Reason (Approved \(final\) by (me))', 'Reason')).toBe('Approved (final) by (me)');
  });
  it('reads hex strings', () => {
    expect(readPdfStringEntry('/Name <48656c6c6f>', 'Name')).toBe('Hello');
  });
  it('returns null when absent', () => {
    expect(readPdfStringEntry('/Other (x)', 'Name')).toBeNull();
  });
});

describe('parsePdfDate', () => {
  it('parses a full date with offset', () => {
    expect(parsePdfDate("D:20240102030405+02'00'")).toBe('2024-01-02T01:04:05.000Z');
  });
  it('parses UTC and partial dates', () => {
    expect(parsePdfDate('D:20240102030405Z')).toBe('2024-01-02T03:04:05.000Z');
    expect(parsePdfDate('D:2024')).toBe('2024-01-01T00:00:00.000Z');
  });
  it('returns null for garbage', () => {
    expect(parsePdfDate('yesterday')).toBeNull();
    expect(parsePdfDate(null)).toBeNull();
  });
});
