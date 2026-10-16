import type { EncodeSpec } from '../_lib/codecs';
import { type RasterFormat, type SniffedFormat } from '../_lib/formats';
import { outputSpec, type OutputChoice } from '../_lib/output';

export interface CompressOptions {
  output: OutputChoice;
  /** oxipng level 0 (fast) – 6 (smallest), used when the result is a PNG. */
  pngLevel: number;
  /** Shrink so the longest side is at most this many pixels; null keeps the size. */
  maxEdge: number | null;
}

export const DEFAULT_COMPRESS: CompressOptions = {
  output: { format: 'same', quality: 75, lossless: false, background: '#ffffff' },
  pngLevel: 3,
  maxEdge: null,
};

export const EDGE_CHOICES = [4096, 2560, 1920, 1280, 1024, 800] as const;

export const PNG_LEVELS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Fast' },
  { value: 3, label: 'Balanced' },
  { value: 6, label: 'Smallest (slow)' },
];

/** The encoder request and concrete format. PNG results are recompressed losslessly (oxipng) instead of using a quality value. */
export function compressSpec(o: CompressOptions, input: SniffedFormat): { spec: EncodeSpec; format: RasterFormat } {
  const { spec, format } = outputSpec(o.output, input);
  if (format === 'png') return { format, spec: { format: 'png', optimise: Math.min(6, Math.max(0, Math.round(o.pngLevel))) } };
  return { spec, format };
}

/** Whether the size controls apply: only when the longest side is actually above the limit. */
export function needsDownscale(width: number, height: number, maxEdge: number | null): boolean {
  return maxEdge !== null && Math.max(width, height) > maxEdge;
}

/** "photo.jpg" → "photo-compressed.jpg". */
export function compressedName(inputName: string, ext: string): string {
  const base = inputName.replace(/\.[^./\\]+$/, '') || 'image';
  return `${base}-compressed.${ext}`;
}

export type Outcome = { kind: 'smaller'; percent: number } | { kind: 'same' } | { kind: 'larger'; percent: number };

/** Plain verdict on whether compressing helped. */
export function outcome(before: number, after: number): Outcome {
  if (before <= 0) return { kind: 'same' };
  const percent = Math.round(((before - after) / before) * 1000) / 10;
  if (Math.abs(percent) < 0.1) return { kind: 'same' };
  return percent > 0 ? { kind: 'smaller', percent } : { kind: 'larger', percent: -percent };
}
