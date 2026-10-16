import { describe, expect, it } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import { protectPdf, randomPassword } from './logic';
import { unlockPdf } from '../unlock/logic';
import { makePdf, pageWidths, widthOfPage } from '../_lib/testPdf';

const open = { password: 'correct horse', allowPrinting: true, allowCopying: true, allowEditing: true };

function text(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('latin1');
}

describe('protectPdf', () => {
  it('produces an AES-256 encrypted file that needs the password', async () => {
    const out = await protectPdf(await makePdf(2), open);
    expect(out.pageCount).toBe(2);
    const raw = text(out.bytes);
    expect(raw).toContain('/Encrypt');
    expect(raw).toContain('/AESV3');
    await expect(PDFDocument.load(out.bytes)).rejects.toThrow(/encrypted/);
    await expect(PDFDocument.load(out.bytes, { password: 'wrong' })).rejects.toThrow(/Password incorrect/);
    const doc = await PDFDocument.load(out.bytes, { password: open.password });
    expect(doc.getPageCount()).toBe(2);
  });
  it('does not leave page text readable in the file', async () => {
    const plain = await makePdf(1);
    const out = await protectPdf(plain, open);
    expect(text(out.bytes)).not.toContain('Page 1');
  });
  it('accepts an owner password and permission limits', async () => {
    const out = await protectPdf(await makePdf(1), { ...open, ownerPassword: 'owner-secret', allowPrinting: false, allowCopying: false, allowEditing: false });
    await expect(PDFDocument.load(out.bytes, { password: 'owner-secret' })).resolves.toBeTruthy();
    await expect(PDFDocument.load(out.bytes, { password: open.password })).resolves.toBeTruthy();
  });
  it('round-trips with Unlock', async () => {
    const out = await protectPdf(await makePdf(3), open);
    const back = await unlockPdf(out.bytes, open.password);
    expect(back.wasEncrypted).toBe(true);
    expect(await pageWidths(back.bytes)).toEqual([1, 2, 3].map(widthOfPage));
  });
  it('rejects a blank password', async () => {
    await expect(protectPdf(await makePdf(1), { ...open, password: '' })).rejects.toThrow(/Enter a password/);
  });
  it('rejects a PDF that is already protected', async () => {
    const out = await protectPdf(await makePdf(1), open);
    await expect(protectPdf(out.bytes, open)).rejects.toThrow(/Unlock PDF/);
  });
  it('rejects input that is not a PDF', async () => {
    await expect(protectPdf(new TextEncoder().encode('nope'), open)).rejects.toThrow(/not a valid PDF|could not be read/);
  });
  it('handles unicode passwords', async () => {
    const out = await protectPdf(await makePdf(1), { ...open, password: 'pässwörd-日本語' });
    await expect(PDFDocument.load(out.bytes, { password: 'pässwörd-日本語' })).resolves.toBeTruthy();
  });
});

describe('randomPassword', () => {
  it('has the requested length and only unambiguous characters', () => {
    const p = randomPassword(40);
    expect(p).toHaveLength(40);
    expect(p).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
  });
  it('differs between calls', () => {
    expect(randomPassword()).not.toBe(randomPassword());
  });
});
