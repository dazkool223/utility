import { pad } from '../_lib/files';

export type ImageFormat = 'png' | 'jpg';

export const DPI_CHOICES = [72, 96, 150, 200, 300] as const;

/** pdf.js draws at 72 dpi when the scale is 1. */
export function dpiToScale(dpi: number): number {
  return dpi / 72;
}

export function imageFileName(base: string, page: number, total: number, format: ImageFormat): string {
  return `${base}-page-${pad(page, total)}.${format}`;
}

export function mimeFor(format: ImageFormat): 'image/png' | 'image/jpeg' {
  return format === 'png' ? 'image/png' : 'image/jpeg';
}
