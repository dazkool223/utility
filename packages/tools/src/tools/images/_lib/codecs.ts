import { ToolError } from '@/core/types';
import { flattenAlpha, FORMATS, sniffFormat, type RasterFormat, type RawImage } from './formats';

/**
 * Decode and encode images. Runs inside a Web Worker in the app; every WASM codec is loaded on first use,
 * from our own origin (Vite emits the .wasm next to the bundle), so nothing here touches the network.
 */

export type EncodeSpec =
  | { format: 'png'; /** oxipng level 0-6; omit for a plain (unoptimised) PNG */ optimise?: number }
  | { format: 'jpeg'; quality: number; /** background for transparent areas, default white */ background?: readonly [number, number, number] }
  | { format: 'webp'; quality: number; lossless?: boolean }
  | { format: 'avif'; quality: number; /** 0 (slowest) – 10 (fastest) */ speed?: number; lossless?: boolean }
  | { format: 'jxl'; quality: number; lossless?: boolean; /** 1 – 9 */ effort?: number }
  | { format: 'qoi' };

const UNREADABLE =
  'This file is not an image this Tool can read. Supported: PNG, JPEG, WebP, GIF, BMP, AVIF, JPEG XL and QOI.';

function toImageData(img: RawImage): ImageData {
  if (img.data.byteOffset !== 0 || img.data.byteLength !== img.data.buffer.byteLength) {
    img = { ...img, data: new Uint8ClampedArray(img.data) };
  }
  return typeof ImageData === 'undefined' ? (img as unknown as ImageData) : new ImageData(img.data as Uint8ClampedArray<ArrayBuffer>, img.width, img.height);
}

function fromImageData(d: ImageData | null): RawImage {
  if (!d) throw new Error('the decoder returned no pixels');
  return { data: d.data, width: d.width, height: d.height };
}

async function viaBrowser(bytes: ArrayBuffer): Promise<RawImage> {
  const bmp = await createImageBitmap(new Blob([bytes]));
  try {
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(bmp, 0, 0);
    return fromImageData(ctx.getImageData(0, 0, bmp.width, bmp.height));
  } finally {
    bmp.close();
  }
}

export async function decodeImage(bytes: ArrayBuffer): Promise<RawImage> {
  const format = sniffFormat(new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 512)));
  try {
    switch (format) {
      case 'avif':
        return fromImageData(await (await import('@jsquash/avif/decode')).default(bytes));
      case 'jxl':
        return fromImageData(await (await import('@jsquash/jxl/decode')).default(bytes));
      case 'qoi':
        return fromImageData(await (await import('@jsquash/qoi/decode')).default(bytes));
      case 'png':
      case 'jpeg':
      case 'webp':
      case 'gif':
      case 'bmp': {
        // The browser handles EXIF orientation and colour tables for us; fall back to our own codecs if it can't.
        if (typeof createImageBitmap === 'function' && typeof OffscreenCanvas !== 'undefined') {
          try {
            return await viaBrowser(bytes);
          } catch {
            /* fall through */
          }
        }
        if (format === 'png') return fromImageData(await (await import('@jsquash/png/decode')).default(bytes));
        if (format === 'jpeg') return fromImageData(await (await import('@jsquash/jpeg/decode')).default(bytes));
        if (format === 'webp') return fromImageData(await (await import('@jsquash/webp/decode')).default(bytes));
        throw new ToolError(`This ${format.toUpperCase()} could not be decoded by your browser.`);
      }
      case 'svg':
        throw new ToolError('SVG files are not supported here. Convert the SVG to PNG first.');
      default:
        throw new ToolError(UNREADABLE);
    }
  } catch (e) {
    if (e instanceof ToolError) throw e;
    throw new ToolError(`The ${FORMATS[format as RasterFormat]?.label ?? 'image'} file is damaged or uses a feature this decoder does not support. (${e instanceof Error ? e.message : String(e)})`);
  }
}

/**
 * Fetch and compile a format's encoder ahead of time, so the first Convert click does not also pay for
 * downloading and instantiating the WASM. Safe to call repeatedly; failures are left for the real call to report.
 */
export async function warmEncoder(format: EncodeSpec['format']): Promise<void> {
  try {
    const tiny: RawImage = { data: new Uint8ClampedArray(4), width: 1, height: 1 };
    await encodeImage(tiny, format === 'png' ? { format } : format === 'qoi' ? { format } : { format, quality: 50 });
  } catch {
    /* the real conversion will surface any problem */
  }
}

const clampQ = (q: number) => Math.min(100, Math.max(0, Math.round(q)));

export async function encodeImage(img: RawImage, spec: EncodeSpec): Promise<Uint8Array> {
  if (img.width < 1 || img.height < 1) throw new ToolError('The image has no pixels.');
  switch (spec.format) {
    case 'png': {
      const png = await (await import('@jsquash/png/encode')).default(toImageData(img));
      if (spec.optimise === undefined) return new Uint8Array(png);
      return optimisePng(png, spec.optimise);
    }
    case 'jpeg': {
      const flat = flattenAlpha(img, spec.background);
      const out = await (await import('@jsquash/jpeg/encode')).default(toImageData(flat), { quality: clampQ(spec.quality) });
      return new Uint8Array(out);
    }
    case 'webp': {
      const out = await (await import('@jsquash/webp/encode')).default(toImageData(img), { quality: clampQ(spec.quality), lossless: spec.lossless ? 1 : 0 });
      return new Uint8Array(out);
    }
    case 'avif': {
      const out = await (await import('@jsquash/avif/encode')).default(toImageData(img), {
        quality: clampQ(spec.quality),
        speed: Math.min(10, Math.max(0, Math.round(spec.speed ?? 6))),
        lossless: !!spec.lossless,
      });
      return new Uint8Array(out);
    }
    case 'jxl': {
      const out = await (await import('@jsquash/jxl/encode')).default(toImageData(img), {
        quality: clampQ(spec.quality),
        lossless: !!spec.lossless,
        effort: Math.min(9, Math.max(1, Math.round(spec.effort ?? 7))),
      });
      return new Uint8Array(out);
    }
    case 'qoi': {
      const out = await (await import('@jsquash/qoi/encode')).default(toImageData(img));
      return new Uint8Array(out);
    }
  }
}

/** Lossless PNG recompression with oxipng. `level` 0 (fast) – 6 (smallest). Pixels are never changed. */
export async function optimisePng(png: ArrayBuffer | Uint8Array, level: number, interlace = false): Promise<Uint8Array> {
  const buf = png instanceof Uint8Array ? (png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer) : png;
  const out = await (await import('@jsquash/oxipng/optimise')).default(buf, {
    level: Math.min(6, Math.max(0, Math.round(level))),
    interlace,
  });
  return new Uint8Array(out);
}

export type ResizeMethod = 'lanczos3' | 'catrom' | 'mitchell' | 'triangle';

export async function resizeImage(img: RawImage, width: number, height: number, method: ResizeMethod = 'lanczos3'): Promise<RawImage> {
  if (width === img.width && height === img.height) return img;
  const out = await (await import('@jsquash/resize')).default(toImageData(img), {
    width,
    height,
    method,
    fitMethod: 'stretch',
    premultiply: true,
    linearRGB: true,
  });
  return fromImageData(out);
}
