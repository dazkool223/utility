import { PDFDocument } from '@cantoo/pdf-lib';
import { ToolError } from '@/core/types';
import { dropEncryptionRemnants, translateLoadError } from '../_lib/pdflib';

export interface UnlockResult {
  bytes: Uint8Array;
  pageCount: number;
  /** False when the input had no encryption at all. */
  wasEncrypted: boolean;
}

/**
 * Open a PDF with a password you know and save a copy with no password and no permission limits.
 * A PDF that only has an owner password (it opens freely but restricts printing or copying) unlocks with a blank password.
 */
export async function unlockPdf(input: Uint8Array | ArrayBuffer, password: string): Promise<UnlockResult> {
  let wasEncrypted: boolean;
  try {
    wasEncrypted = (await PDFDocument.load(input, { ignoreEncryption: true })).isEncrypted;
  } catch (e) {
    throw translateLoadError(e);
  }
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(input, { password });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (/password incorrect|needs? password/i.test(message)) {
      throw new ToolError(password ? 'That password is not correct for this PDF.' : 'This PDF needs a password to open. Enter it above.');
    }
    throw translateLoadError(e, true);
  }
  dropEncryptionRemnants(doc);
  return { bytes: await doc.save(), pageCount: doc.getPageCount(), wasEncrypted };
}
