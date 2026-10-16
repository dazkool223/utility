import { ToolError } from '@/core/types';
import { loadPdf } from '../_lib/pdflib';

export interface ProtectOptions {
  /** Needed to open the PDF. */
  password: string;
  /** Needed to lift the restrictions. Blank means a random one that nobody sees. */
  ownerPassword?: string;
  allowPrinting: boolean;
  allowCopying: boolean;
  allowEditing: boolean;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** A random password from the Web Crypto generator. Rejection sampling avoids modulo bias. */
export function randomPassword(length = 32): string {
  const limit = 256 - (256 % ALPHABET.length);
  let out = '';
  const buf = new Uint8Array(length * 2);
  while (out.length < length) {
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b < limit && out.length < length) out += ALPHABET[b % ALPHABET.length];
    }
  }
  return out;
}

/** Encrypt a PDF with AES-256. Everything inside the file, including text and images, is encrypted. */
export async function protectPdf(input: Uint8Array | ArrayBuffer, options: ProtectOptions): Promise<{ bytes: Uint8Array; pageCount: number }> {
  if (!options.password) throw new ToolError('Enter a password to protect the PDF with.');
  const doc = await loadPdf(input);
  doc.encrypt({
    userPassword: options.password,
    ownerPassword: options.ownerPassword || randomPassword(),
    algorithm: 'AES-256',
    permissions: {
      printing: options.allowPrinting ? 'highResolution' : false,
      copying: options.allowCopying,
      modifying: options.allowEditing,
      annotating: options.allowEditing,
      fillingForms: options.allowEditing,
      documentAssembly: options.allowEditing,
      contentAccessibility: true,
    },
  });
  return { bytes: await doc.save(), pageCount: doc.getPageCount() };
}
