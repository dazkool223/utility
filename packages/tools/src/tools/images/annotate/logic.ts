import { ToolError } from '@/core/types';
import { clampRect, type Rect } from '../_lib/pixels';

export type AnnotationKind = 'text' | 'watermark' | 'pixelate' | 'redact';

interface Base {
  id: number;
}

export interface TextNote extends Base {
  kind: 'text';
  text: string;
  /** Top-left corner, in image pixels. */
  x: number;
  y: number;
  /** Font size in image pixels. */
  size: number;
  /** "#rrggbb" */
  colour: string;
  /** 5–100 */
  opacity: number;
  bold: boolean;
}

export interface Watermark extends Base {
  kind: 'watermark';
  text: string;
  size: number;
  colour: string;
  opacity: number;
  /** Degrees, -90 to 90. Negative leans up to the right. */
  angle: number;
  bold: boolean;
}

export interface PixelateArea extends Base {
  kind: 'pixelate';
  rect: Rect;
  /** Mosaic cell size in image pixels. */
  block: number;
}

export interface RedactArea extends Base {
  kind: 'redact';
  rect: Rect;
  colour: string;
}

export type Annotation = TextNote | Watermark | PixelateArea | RedactArea;

export const MAX_ANNOTATIONS = 50;

export const KIND_LABEL: Record<AnnotationKind, string> = {
  text: 'Text',
  watermark: 'Watermark',
  pixelate: 'Pixelate',
  redact: 'Cover',
};

/** A sensible font size for a picture this wide: about 5% of its width. */
export function defaultFontSize(width: number): number {
  return Math.max(12, Math.round(width * 0.05));
}

/** A new annotation of `kind`, placed sensibly on a `width`×`height` picture. */
export function newAnnotation(kind: AnnotationKind, id: number, width: number, height: number): Annotation {
  const centre = clampRect({ x: width * 0.3, y: height * 0.35, w: width * 0.4, h: height * 0.3 }, width, height) ?? { x: 0, y: 0, w: width, h: height };
  switch (kind) {
    case 'text':
      return { id, kind, text: 'Your text', x: Math.round(width * 0.05), y: Math.round(height * 0.05), size: defaultFontSize(width), colour: '#ffffff', opacity: 100, bold: true };
    case 'watermark':
      return { id, kind, text: 'DRAFT', size: defaultFontSize(width), colour: '#808080', opacity: 35, angle: -30, bold: true };
    case 'pixelate':
      return { id, kind, rect: centre, block: Math.max(4, Math.round(Math.min(centre.w, centre.h) / 12)) };
    case 'redact':
      return { id, kind, rect: centre, colour: '#000000' };
  }
}

/** Throws a plain-language ToolError when an annotation can't be drawn. */
export function validateAnnotation(a: Annotation, width: number, height: number): void {
  if (a.kind === 'text' || a.kind === 'watermark') {
    if (!a.text.trim()) throw new ToolError(`${KIND_LABEL[a.kind]} needs some text.`);
    if (!(a.size >= 4 && a.size <= 2000)) throw new ToolError('Text size must be between 4 and 2000 pixels.');
    if (!(a.opacity >= 5 && a.opacity <= 100)) throw new ToolError('Opacity must be between 5 and 100%.');
    if (a.kind === 'watermark' && !(a.angle >= -90 && a.angle <= 90)) throw new ToolError('The angle must be between -90 and 90 degrees.');
    if (a.kind === 'text' && (!Number.isFinite(a.x) || !Number.isFinite(a.y))) throw new ToolError('Give the text a position on the picture.');
  } else {
    if (!clampRect(a.rect, width, height)) throw new ToolError(`The ${KIND_LABEL[a.kind].toLowerCase()} area is empty or outside the picture. Draw it again.`);
    if (a.kind === 'pixelate' && !(a.block >= 2 && a.block <= 500)) throw new ToolError('The mosaic block size must be between 2 and 500 pixels.');
  }
}

/** One line for the list of annotations. */
export function describeAnnotation(a: Annotation): string {
  switch (a.kind) {
    case 'text':
      return `Text: “${a.text.length > 24 ? a.text.slice(0, 24) + '…' : a.text}”`;
    case 'watermark':
      return `Watermark: “${a.text.length > 24 ? a.text.slice(0, 24) + '…' : a.text}”`;
    case 'pixelate':
      return `Pixelate ${Math.round(a.rect.w)}×${Math.round(a.rect.h)}`;
    case 'redact':
      return `Cover ${Math.round(a.rect.w)}×${Math.round(a.rect.h)}`;
  }
}

/** The rectangle an annotation occupies, for the outline drawn over the picture. Text size is estimated. */
export function annotationBounds(a: Annotation, width: number, height: number): Rect | null {
  if (a.kind === 'watermark') return null;
  if (a.kind === 'text') {
    const lines = a.text.split('\n');
    const longest = Math.max(...lines.map((l) => l.length), 1);
    return clampRect({ x: a.x, y: a.y, w: longest * a.size * 0.58, h: lines.length * a.size * 1.2 }, width, height);
  }
  return clampRect(a.rect, width, height);
}

/** Top-left corners of the cells a watermark repeats in, covering a `width`×`height` area. */
export function tileOrigins(width: number, height: number, cellW: number, cellH: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  if (!(cellW > 0 && cellH > 0)) return out;
  const cols = Math.ceil(width / cellW);
  const rows = Math.ceil(height / cellH);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push([c * cellW, r * cellH]);
  return out;
}

export function annotatedName(inputName: string, ext: string): string {
  const base = inputName.replace(/\.[^./\\]+$/, '') || 'image';
  return `${base}-annotated.${ext}`;
}
