import { transfer } from 'comlink';
import { ToolError } from '@/core/types';
import { decodeImage, encodeImage, type EncodeSpec } from './codecs';
import { FORMATS, sniffFormat, type RasterFormat, type RawImage, type SniffedFormat } from './formats';
import { fitWithin } from './pixels';

/** Worker-side helpers shared by the image Tools. Used from each Tool's own worker.ts. */

export interface ImageInfo {
  width: number;
  height: number;
  format: SniffedFormat;
  /** Size of the file that was loaded. */
  bytes: number;
}

export interface EncodedImage {
  bytes: Uint8Array;
  width: number;
  height: number;
  format: RasterFormat;
  mime: string;
}

export interface PreviewImage {
  /** PNG bytes, scaled to fit the requested edge. */
  bytes: Uint8Array;
  width: number;
  height: number;
  /** Size of the image the preview stands for. */
  fullWidth: number;
  fullHeight: number;
}

/** Encode pixels as PNG for on-screen previews: the browser canvas when available (fast), else our codec. */
export async function pngForPreview(img: RawImage): Promise<Uint8Array> {
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const canvas = new OffscreenCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(new ImageData(img.data as Uint8ClampedArray<ArrayBuffer>, img.width, img.height), 0, 0);
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        return new Uint8Array(await blob.arrayBuffer());
      }
    } catch {
      /* fall back to the WASM encoder */
    }
  }
  return encodeImage(img, { format: 'png' });
}

/** Scale pixels down with the browser's resampler (previews only; exports use the WASM resizer). */
export function scaleForPreview(img: RawImage, maxEdge: number): RawImage {
  const { width, height } = fitWithin(img.width, img.height, maxEdge);
  if (width === img.width && height === img.height) return img;
  if (typeof OffscreenCanvas === 'undefined') return img;
  const src = new OffscreenCanvas(img.width, img.height);
  src.getContext('2d')!.putImageData(new ImageData(img.data as Uint8ClampedArray<ArrayBuffer>, img.width, img.height), 0, 0);
  const dst = new OffscreenCanvas(width, height);
  const ctx = dst.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, width, height);
  const d = ctx.getImageData(0, 0, width, height);
  return { data: d.data, width, height };
}

export async function makePreview(img: RawImage, maxEdge: number): Promise<PreviewImage> {
  const small = scaleForPreview(img, maxEdge);
  const bytes = await pngForPreview(small);
  return transfer({ bytes, width: small.width, height: small.height, fullWidth: img.width, fullHeight: img.height }, [bytes.buffer as ArrayBuffer]);
}

/** Encode and package the result so the bytes move to the page without a copy. */
export async function encodeResult(img: RawImage, spec: EncodeSpec): Promise<EncodedImage> {
  const bytes = await encodeImage(img, spec);
  const result: EncodedImage = { bytes, width: img.width, height: img.height, format: spec.format, mime: FORMATS[spec.format].mime };
  return transfer(result, [bytes.buffer as ArrayBuffer]);
}

/**
 * Holds one decoded image inside a worker so option changes re-render without decoding again.
 * Call `load` first; the other methods read the stored pixels.
 */
export function createSession() {
  let image: RawImage | null = null;
  let original: ArrayBuffer | null = null;
  let format: SniffedFormat = 'unknown';
  return {
    async load(buf: ArrayBuffer): Promise<ImageInfo> {
      image = null;
      original = null;
      const decoded = await decodeImage(buf);
      image = decoded;
      original = buf;
      format = sniffFormat(new Uint8Array(buf, 0, Math.min(buf.byteLength, 512)));
      return { width: decoded.width, height: decoded.height, format, bytes: buf.byteLength };
    },
    image(): RawImage {
      if (!image) throw new ToolError('Choose an image first.');
      return image;
    },
    originalBytes(): ArrayBuffer {
      if (!original) throw new ToolError('Choose an image first.');
      return original;
    },
    format: () => format,
    clear() {
      image = null;
      original = null;
      format = 'unknown';
    },
  };
}
