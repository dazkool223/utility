import type { PDFDocumentProxy } from 'pdfjs-dist';
import { ToolError } from '@/core/types';

/**
 * pdf.js, with its worker, fonts, colour profiles and WASM decoders all served from our own origin
 * (apps/web/public/engines/pdfjs). Parsing runs in pdf.js's own Web Worker; only the canvas drawing is on the main thread.
 */
const BASE = '/engines/pdfjs/';

let loaded: Promise<typeof import('pdfjs-dist')> | undefined;

export function loadPdfjs() {
  loaded ??= import('pdfjs-dist').then((m) => {
    m.GlobalWorkerOptions.workerSrc = `${BASE}pdf.worker.min.mjs`;
    return m;
  });
  return loaded;
}

export type OpenPdf = PDFDocumentProxy & { destroy(): Promise<void> };

export async function openPdf(data: ArrayBuffer | Uint8Array, password?: string): Promise<OpenPdf> {
  const pdfjs = await loadPdfjs();
  // pdf.js takes ownership of the buffer it is given, so hand it a copy.
  const copy = data instanceof Uint8Array ? data.slice() : new Uint8Array(data.slice(0));
  const task = pdfjs.getDocument({
    data: copy,
    password,
    wasmUrl: `${BASE}wasm/`,
    standardFontDataUrl: `${BASE}standard_fonts/`,
    cMapUrl: `${BASE}cmaps/`,
    cMapPacked: true,
    iccUrl: `${BASE}iccs/`,
    ...({ isEvalSupported: false } as object),
    enableXfa: false,
  });
  try {
    const doc = await task.promise;
    return Object.assign(doc, { destroy: () => task.destroy() });
  } catch (e) {
    const name = (e as { name?: string }).name;
    if (name === 'PasswordException') {
      throw new ToolError(
        password === undefined ? 'This PDF is password-protected. Remove the password first with the Unlock PDF Tool.' : 'That password is not correct for this PDF.',
      );
    }
    if (name === 'InvalidPDFException' || name === 'FormatError') throw new ToolError('This file is not a valid PDF, or it is damaged.');
    throw new ToolError(`This PDF could not be opened: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const MAX_CANVAS_PIXELS = 100_000_000;

/** Draw one page (1-based) onto a new canvas at `scale` (1 = 72 dpi). */
export async function renderPage(doc: PDFDocumentProxy, pageNumber: number, scale: number): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const width = Math.ceil(viewport.width);
  const height = Math.ceil(viewport.height);
  if (width * height > MAX_CANVAS_PIXELS || width > 32000 || height > 32000) {
    page.cleanup();
    throw new ToolError(`Page ${pageNumber} would be ${width} × ${height} pixels at this resolution, which is too large for the browser. Choose a lower resolution.`);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ToolError('This browser could not create a drawing surface for the page.');
  await page.render({ canvas, canvasContext: ctx, viewport, background: 'rgb(255,255,255)' }).promise;
  page.cleanup();
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: 'image/png' | 'image/jpeg', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new ToolError('The browser could not encode the page image.'))), type, quality);
  });
}
