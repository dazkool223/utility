import { loadPdf } from './pdflib';

/** Page count of a PDF (worker side). Throws a ToolError for locked or damaged files. */
export async function pageCountOf(bytes: Uint8Array | ArrayBuffer): Promise<number> {
  return (await loadPdf(bytes)).getPageCount();
}
