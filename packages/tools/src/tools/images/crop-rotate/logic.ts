import type { RawImage } from '../_lib/formats';
import { clampRect, flipImage, rotateImage, type Rect, type Rotation } from '../_lib/pixels';

/** Flips are applied first, then the picture is turned clockwise. */
export interface Transform {
  rotation: Rotation;
  flipH: boolean;
  flipV: boolean;
}

export const IDENTITY: Transform = { rotation: 0, flipH: false, flipV: false };

export function isIdentity(t: Transform): boolean {
  return t.rotation === 0 && !t.flipH && !t.flipV;
}

/** Turn a quarter clockwise (+90) or anticlockwise (-90). */
export function rotateBy(t: Transform, degrees: 90 | -90): Transform {
  return { ...t, rotation: ((t.rotation + degrees + 360) % 360) as Rotation };
}

export function transformedSize(width: number, height: number, t: Transform): { width: number; height: number } {
  return t.rotation === 90 || t.rotation === 270 ? { width: height, height: width } : { width, height };
}

export function applyTransform(img: RawImage, t: Transform): RawImage {
  return rotateImage(flipImage(img, t.flipH, t.flipV), t.rotation);
}

export interface AspectChoice {
  id: string;
  label: string;
  /** width / height; null means free-form. */
  ratio: number | null;
}

export const ASPECTS: readonly AspectChoice[] = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '1:1', label: '1:1 (square)', ratio: 1 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '3:4', label: '3:4 (portrait)', ratio: 3 / 4 },
  { id: '2:3', label: '2:3 (portrait)', ratio: 2 / 3 },
  { id: '9:16', label: '9:16 (portrait)', ratio: 9 / 16 },
];

/** The biggest rectangle of the given ratio that fits the picture, centred. With no ratio, the whole picture. */
export function centredRect(width: number, height: number, ratio: number | null): Rect {
  if (!ratio) return { x: 0, y: 0, w: width, h: height };
  let w = width;
  let h = Math.round(w / ratio);
  if (h > height) {
    h = height;
    w = Math.round(h * ratio);
  }
  return { x: Math.round((width - w) / 2), y: Math.round((height - h) / 2), w: Math.max(1, w), h: Math.max(1, h) };
}

export function coversWholeImage(rect: Rect, width: number, height: number): boolean {
  const r = clampRect(rect, width, height);
  return !!r && r.x === 0 && r.y === 0 && r.w === width && r.h === height;
}

/** Plain-language summary of what will be done, or null when nothing changes. */
export function describeEdit(t: Transform, crop: Rect | null): string | null {
  const parts: string[] = [];
  if (t.flipH) parts.push('flipped left–right');
  if (t.flipV) parts.push('flipped top–bottom');
  if (t.rotation) parts.push(`rotated ${t.rotation}° clockwise`);
  if (crop) parts.push(`cropped to ${crop.w}×${crop.h}`);
  return parts.length ? parts.join(', ') : null;
}

export function editedName(inputName: string, ext: string): string {
  const base = inputName.replace(/\.[^./\\]+$/, '') || 'image';
  return `${base}-edited.${ext}`;
}
