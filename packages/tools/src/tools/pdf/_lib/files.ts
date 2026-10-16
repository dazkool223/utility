/** Small helpers shared by the PDF Tools. No PDF engine is imported here, so this stays out of the Tool chunk's weight. */

export function pdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
}

export function stripExtension(name: string): string {
  return name.replace(/\.[^./\\]+$/, '') || 'document';
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/** Zero-padded index so files sort correctly: pad(3, 12) is "03". */
export function pad(n: number, total: number): string {
  return String(n).padStart(String(total).length, '0');
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return typeof e === 'string' && e ? e : 'Something went wrong while processing this PDF.';
}
