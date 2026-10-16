import { ToolError } from '@/core/types';
import type { EncodeSpec } from '../_lib/codecs';
import { parseHexColour, type RasterFormat } from '../_lib/formats';

export interface ConvertOptions {
  format: RasterFormat;
  /** 1–100. Ignored for PNG, QOI and lossless modes. */
  quality: number;
  lossless: boolean;
  /** Fill for transparent areas when the target has no alpha channel (JPEG). */
  background: string;
  /** AVIF speed: 0 = smallest and slowest, 10 = fastest. */
  avifSpeed: number;
}

export const DEFAULT_QUALITY: Record<RasterFormat, number> = { png: 100, jpeg: 80, webp: 80, avif: 50, jxl: 75, qoi: 100 };

export const defaultOptions: ConvertOptions = { format: 'webp', quality: 80, lossless: false, background: '#ffffff', avifSpeed: 6 };

/** Formats where a quality slider means something. */
export function hasQuality(format: RasterFormat, lossless: boolean): boolean {
  return (format === 'jpeg' || format === 'webp' || format === 'avif' || format === 'jxl') && !(lossless && format !== 'jpeg');
}

export function hasLosslessMode(format: RasterFormat): boolean {
  return format === 'webp' || format === 'avif' || format === 'jxl';
}

/** Turn the form values into an encoder request, rejecting values that make no sense. */
export function buildSpec(o: ConvertOptions): EncodeSpec {
  if (!Number.isFinite(o.quality) || o.quality < 1 || o.quality > 100) throw new ToolError('Quality must be between 1 and 100.');
  const quality = Math.round(o.quality);
  switch (o.format) {
    case 'png':
      return { format: 'png' };
    case 'qoi':
      return { format: 'qoi' };
    case 'jpeg':
      return { format: 'jpeg', quality, background: parseHexColour(o.background) };
    case 'webp':
      return { format: 'webp', quality, lossless: o.lossless };
    case 'avif':
      return { format: 'avif', quality, lossless: o.lossless, speed: o.avifSpeed };
    case 'jxl':
      return { format: 'jxl', quality, lossless: o.lossless };
  }
}

/** Make output names unique inside one zip: a.png, a.png → a.png, a-2.png. */
export function uniqueNames(names: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const n = (seen.get(name) ?? 0) + 1;
    seen.set(name, n);
    if (n === 1) return name;
    const dot = name.lastIndexOf('.');
    return dot > 0 ? `${name.slice(0, dot)}-${n}${name.slice(dot)}` : `${name}-${n}`;
  });
}
