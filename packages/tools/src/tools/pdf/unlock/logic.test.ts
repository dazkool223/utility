import { describe, expect, it } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import { unlockPdf } from './logic';
import { makePdf, pageWidths, widthOfPage } from '../_lib/testPdf';

async function encrypted(userPassword: string, ownerPassword: string, permissions = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.load(await makePdf(2));
  doc.encrypt({ userPassword, ownerPassword, permissions });
  return doc.save();
}

describe('unlockPdf', () => {
  it('removes the password so the file opens with no options', async () => {
    const out = await unlockPdf(await encrypted('open-me', 'owner'), 'open-me');
    expect(out.wasEncrypted).toBe(true);
    expect(out.pageCount).toBe(2);
    expect((await PDFDocument.load(out.bytes)).isEncrypted).toBe(false);
    expect(await pageWidths(out.bytes)).toEqual([1, 2].map(widthOfPage));
  });
  it('works with the owner password too', async () => {
    const out = await unlockPdf(await encrypted('open-me', 'owner'), 'owner');
    expect(out.wasEncrypted).toBe(true);
  });
  it('removes permission limits from a PDF that opens without a password', async () => {
    const locked = await encrypted('', 'owner', { printing: false, copying: false, modifying: false });
    const out = await unlockPdf(locked, '');
    expect(out.wasEncrypted).toBe(true);
    await expect(PDFDocument.load(out.bytes)).resolves.toBeTruthy();
  });
  it('says so when the PDF was not protected', async () => {
    const out = await unlockPdf(await makePdf(1), '');
    expect(out.wasEncrypted).toBe(false);
    expect(out.pageCount).toBe(1);
  });
  it('reports a wrong password in plain language', async () => {
    await expect(unlockPdf(await encrypted('open-me', 'owner'), 'nope')).rejects.toThrow('That password is not correct for this PDF.');
  });
  it('asks for a password when none was given', async () => {
    await expect(unlockPdf(await encrypted('open-me', 'owner'), '')).rejects.toThrow(/needs a password/);
  });
  it('rejects input that is not a PDF', async () => {
    await expect(unlockPdf(new TextEncoder().encode('nope'), '')).rejects.toThrow(/not a valid PDF|could not be read/);
  });
});
