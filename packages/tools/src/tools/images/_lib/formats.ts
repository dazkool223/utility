/** Image formats this category reads and writes, plus pure helpers that need no codec. */

export type RasterFormat = 'png' | 'jpeg' | 'webp' | 'avif' | 'jxl' | 'qoi';
export type SniffedFormat = RasterFormat | 'gif' | 'bmp' | 'svg' | 'unknown';

/** Decoded pixels: RGBA, 8 bits per channel, not premultiplied. `data` always owns its whole buffer. */
export interface RawImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface FormatInfo {
  label: string;
  mime: string;
  ext: string;
  lossy: boolean;
  alpha: boolean;
}

export const FORMATS: Record<RasterFormat, FormatInfo> = {
  png: { label: 'PNG', mime: 'image/png', ext: 'png', lossy: false, alpha: true },
  jpeg: { label: 'JPEG', mime: 'image/jpeg', ext: 'jpg', lossy: true, alpha: false },
  webp: { label: 'WebP', mime: 'image/webp', ext: 'webp', lossy: true, alpha: true },
  avif: { label: 'AVIF', mime: 'image/avif', ext: 'avif', lossy: true, alpha: true },
  jxl: { label: 'JPEG XL', mime: 'image/jxl', ext: 'jxl', lossy: true, alpha: true },
  qoi: { label: 'QOI', mime: 'image/qoi', ext: 'qoi', lossy: false, alpha: true },
};

export const FORMAT_ORDER: readonly RasterFormat[] = ['png', 'jpeg', 'webp', 'avif', 'jxl', 'qoi'];

const ascii = (b: Uint8Array, at: number, len: number) => String.fromCharCode(...b.subarray(at, at + len));

/** Identify an image by its magic bytes. */
export function sniffFormat(b: Uint8Array): SniffedFormat {
  if (b.length < 12) return b.length >= 2 && b[0] === 0xff && b[1] === 0xd8 ? 'jpeg' : 'unknown';
  if (b[0] === 0x89 && ascii(b, 1, 3) === 'PNG') return 'png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return 'webp';
  if (ascii(b, 0, 3) === 'GIF') return 'gif';
  if (b[0] === 0x42 && b[1] === 0x4d) return 'bmp';
  if (ascii(b, 0, 4) === 'qoif') return 'qoi';
  if (ascii(b, 4, 4) === 'ftyp' && /^avi[fs]$/.test(ascii(b, 8, 4))) return 'avif';
  if (b[0] === 0xff && b[1] === 0x0a) return 'jxl';
  if (b[0] === 0 && b[1] === 0 && b[2] === 0 && b[3] === 0x0c && ascii(b, 4, 4) === 'JXL ') return 'jxl';
  const head = new TextDecoder().decode(b.subarray(0, 256)).trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)?<svg[\s>]/i.test(head)) return 'svg';
  return 'unknown';
}

/** Formats a browser can normally show in an <img>; the others get a worker-made PNG preview. */
export function isBrowserDisplayable(f: SniffedFormat): boolean {
  return f === 'png' || f === 'jpeg' || f === 'webp' || f === 'gif' || f === 'bmp' || f === 'avif';
}

/** "photo.jpeg" + "webp" → "photo.webp". Adds a suffix when asked ("photo-resized.webp"). */
export function outputName(inputName: string, ext: string, suffix = ''): string {
  const base = inputName.replace(/\.[^./\\]+$/, '') || 'image';
  return `${base}${suffix}.${ext}`;
}

/** Output format for tools that offer "same as input": formats we can't write fall back to PNG. */
export function resolveOutputFormat(choice: RasterFormat | 'same', input: SniffedFormat): RasterFormat {
  if (choice !== 'same') return choice;
  return input === 'png' || input === 'jpeg' || input === 'webp' ? input : 'png';
}

export function hasTransparency(img: RawImage): boolean {
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) if (d[i]! < 255) return true;
  return false;
}

/** Composite onto a solid background (JPEG has no alpha). Returns a new image. */
export function flattenAlpha(img: RawImage, bg: readonly [number, number, number] = [255, 255, 255]): RawImage {
  const out = new Uint8ClampedArray(img.data.length);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]! / 255;
    out[i] = Math.round(d[i]! * a + bg[0] * (1 - a));
    out[i + 1] = Math.round(d[i + 1]! * a + bg[1] * (1 - a));
    out[i + 2] = Math.round(d[i + 2]! * a + bg[2] * (1 - a));
    out[i + 3] = 255;
  }
  return { data: out, width: img.width, height: img.height };
}

/** "#rrggbb" → [r, g, b]; anything else → white. */
export function parseHexColour(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [255, 255, 255];
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Percentage saved, rounded to one decimal; negative when the result grew. */
export function percentSaved(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.round(((before - after) / before) * 1000) / 10;
}

export function megapixels(width: number, height: number): number {
  return (width * height) / 1_000_000;
}
