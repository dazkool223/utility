import { PDFDocument, type PDFImage } from '@cantoo/pdf-lib';
import { ToolError } from '@/core/types';
import { detectImageType } from './imageType';

export type PageSize = 'fit' | 'a4' | 'letter';
export type Orientation = 'auto' | 'portrait' | 'landscape';

export interface ImageInput {
  name: string;
  /** A JPEG or PNG file. Other formats must be converted to PNG by the caller. */
  bytes: Uint8Array | ArrayBuffer;
}

export interface ImagesOptions {
  pageSize: PageSize;
  orientation: Orientation;
  /** Margin in points (72 per inch) for A4 and Letter pages. */
  margin: number;
}

export const PAGE_POINTS: Record<Exclude<PageSize, 'fit'>, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

/** "Fit to image" pages treat images as 96 dpi, the screen convention, so a 1600 px photo is about 22 inches wide. */
const PX_TO_PT = 72 / 96;

export interface Placement {
  pageWidth: number;
  pageHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Page size and image position for one image. Pure so it can be tested without a PDF. */
export function placeImage(imgWidth: number, imgHeight: number, options: ImagesOptions): Placement {
  if (options.pageSize === 'fit') {
    const width = imgWidth * PX_TO_PT;
    const height = imgHeight * PX_TO_PT;
    return { pageWidth: width, pageHeight: height, x: 0, y: 0, width, height };
  }
  let [pw, ph] = PAGE_POINTS[options.pageSize];
  const landscape = options.orientation === 'landscape' || (options.orientation === 'auto' && imgWidth > imgHeight);
  if (landscape) [pw, ph] = [ph, pw];
  const margin = Math.max(0, Math.min(options.margin, Math.min(pw, ph) / 2 - 1));
  const boxW = pw - margin * 2;
  const boxH = ph - margin * 2;
  const scale = Math.min(boxW / imgWidth, boxH / imgHeight);
  const width = imgWidth * scale;
  const height = imgHeight * scale;
  return { pageWidth: pw, pageHeight: ph, x: (pw - width) / 2, y: (ph - height) / 2, width, height };
}

export async function imagesToPdf(images: ImageInput[], options: ImagesOptions): Promise<{ bytes: Uint8Array; pageCount: number }> {
  if (!images.length) throw new ToolError('Add at least one image.');
  const doc = await PDFDocument.create();
  for (const img of images) {
    const data = img.bytes instanceof Uint8Array ? img.bytes : new Uint8Array(img.bytes);
    const type = detectImageType(data);
    if (!type) throw new ToolError(`${img.name}: only JPEG and PNG images can be placed in a PDF directly.`);
    let embedded: PDFImage;
    try {
      embedded = type === 'jpeg' ? await doc.embedJpg(data) : await doc.embedPng(data);
    } catch (e) {
      throw new ToolError(`${img.name}: this image could not be read (${e instanceof Error ? e.message : String(e)}).`);
    }
    const p = placeImage(embedded.width, embedded.height, options);
    const page = doc.addPage([p.pageWidth, p.pageHeight]);
    page.drawImage(embedded, { x: p.x, y: p.y, width: p.width, height: p.height });
  }
  return { bytes: await doc.save(), pageCount: doc.getPageCount() };
}
