import { PDFDocument, PDFDict, PDFName, PDFStream } from '@cantoo/pdf-lib';
import { ToolError } from '@/core/types';

/** Runs inside Web Workers. Loads a PDF with plain-language errors. */
export async function loadPdf(bytes: Uint8Array | ArrayBuffer, password?: string): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, password === undefined ? {} : { password });
  } catch (e) {
    throw translateLoadError(e, password !== undefined);
  }
}

export function translateLoadError(e: unknown, triedPassword = false): ToolError {
  if (e instanceof ToolError) return e;
  const name = e instanceof Error ? e.constructor.name : '';
  const message = e instanceof Error ? e.message : String(e);
  if (name === 'EncryptedPDFError' || /is encrypted/i.test(message)) {
    return new ToolError('This PDF is password-protected. Remove the password first with the Unlock PDF Tool.');
  }
  if (/password incorrect|wrong password|invalid password|needs? password/i.test(message)) {
    return new ToolError(triedPassword ? 'That password is not correct for this PDF.' : 'This PDF needs a password.');
  }
  if (/no PDF header|Failed to parse PDF|Invalid PDF|header not found/i.test(message)) {
    return new ToolError('This file is not a valid PDF, or it is damaged.');
  }
  return new ToolError(`This PDF could not be read: ${message}`);
}

/**
 * pdf-lib keeps the old /Encrypt dictionary as a stray object after decrypting, and a later load then
 * treats the file as encrypted again. Dropping it makes the saved file plainly unencrypted.
 */
export function dropEncryptionRemnants(doc: PDFDocument): void {
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    const dict = obj instanceof PDFStream ? obj.dict : obj instanceof PDFDict ? obj : undefined;
    if (!dict) continue;
    if (dict.get(PDFName.of('Filter')) === PDFName.of('Standard') && dict.get(PDFName.of('V'))) doc.context.delete(ref);
  }
}

/** Copy the given 0-based pages of `src` into a brand-new document, in order. */
export async function extractPages(src: PDFDocument, indexes: number[]): Promise<PDFDocument> {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indexes);
  for (const p of pages) out.addPage(p);
  return out;
}
