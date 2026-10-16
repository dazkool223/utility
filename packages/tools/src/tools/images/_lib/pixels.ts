import type { RawImage } from './formats';

/** Pure pixel operations on RGBA images. No DOM, so they run (and are tested) in Node. */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Rotation = 0 | 90 | 180 | 270;

export function createImage(width: number, height: number, fill?: readonly [number, number, number, number]): RawImage {
  const data = new Uint8ClampedArray(width * height * 4);
  if (fill) for (let i = 0; i < data.length; i += 4) data.set(fill, i);
  return { data, width, height };
}

export function cloneImage(img: RawImage): RawImage {
  return { data: new Uint8ClampedArray(img.data), width: img.width, height: img.height };
}

/** Round to whole pixels and keep inside the image. Returns null when nothing is left. */
export function clampRect(rect: Rect, width: number, height: number): Rect | null {
  const x0 = Math.max(0, Math.round(rect.x));
  const y0 = Math.max(0, Math.round(rect.y));
  const x1 = Math.min(width, Math.round(rect.x + rect.w));
  const y1 = Math.min(height, Math.round(rect.y + rect.h));
  if (!(x1 > x0) || !(y1 > y0)) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function cropImage(img: RawImage, rect: Rect): RawImage {
  const r = clampRect(rect, img.width, img.height);
  if (!r) throw new Error('The crop area is empty or outside the image.');
  const out = new Uint8ClampedArray(r.w * r.h * 4);
  for (let y = 0; y < r.h; y++) {
    const start = ((r.y + y) * img.width + r.x) * 4;
    out.set(img.data.subarray(start, start + r.w * 4), y * r.w * 4);
  }
  return { data: out, width: r.w, height: r.h };
}

function words(img: RawImage): Uint32Array {
  return new Uint32Array(img.data.buffer, img.data.byteOffset, img.width * img.height);
}

/** Rotate clockwise by a multiple of 90 degrees. */
export function rotateImage(img: RawImage, degrees: Rotation): RawImage {
  if (degrees === 0) return img;
  const { width: w, height: h } = img;
  const swap = degrees !== 180;
  const out = createImage(swap ? h : w, swap ? w : h);
  const src = words(img);
  const dst = words(out);
  const dw = out.width;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = src[y * w + x]!;
      if (degrees === 90) dst[x * dw + (h - 1 - y)] = v;
      else if (degrees === 180) dst[(h - 1 - y) * dw + (w - 1 - x)] = v;
      else dst[(w - 1 - x) * dw + y] = v;
    }
  }
  return out;
}

export function flipImage(img: RawImage, horizontal: boolean, vertical: boolean): RawImage {
  if (!horizontal && !vertical) return img;
  const { width: w, height: h } = img;
  const out = createImage(w, h);
  const src = words(img);
  const dst = words(out);
  for (let y = 0; y < h; y++) {
    const sy = vertical ? h - 1 - y : y;
    for (let x = 0; x < w; x++) dst[y * w + x] = src[sy * w + (horizontal ? w - 1 - x : x)]!;
  }
  return out;
}

/** Mosaic a region in place: each `block`×`block` cell (aligned to the region's corner) becomes its average colour. */
export function pixelateInPlace(img: RawImage, rect: Rect, block: number): void {
  const r = clampRect(rect, img.width, img.height);
  if (!r) return;
  const size = Math.max(1, Math.round(block));
  const d = img.data;
  for (let by = r.y; by < r.y + r.h; by += size) {
    for (let bx = r.x; bx < r.x + r.w; bx += size) {
      const x1 = Math.min(bx + size, r.x + r.w);
      const y1 = Math.min(by + size, r.y + r.h);
      let sr = 0, sg = 0, sb = 0, sa = 0, n = 0;
      for (let y = by; y < y1; y++) {
        for (let x = bx; x < x1; x++) {
          const i = (y * img.width + x) * 4;
          sr += d[i]!; sg += d[i + 1]!; sb += d[i + 2]!; sa += d[i + 3]!;
          n++;
        }
      }
      const ar = Math.round(sr / n), ag = Math.round(sg / n), ab = Math.round(sb / n), aa = Math.round(sa / n);
      for (let y = by; y < y1; y++) {
        for (let x = bx; x < x1; x++) {
          const i = (y * img.width + x) * 4;
          d[i] = ar; d[i + 1] = ag; d[i + 2] = ab; d[i + 3] = aa;
        }
      }
    }
  }
}

/** Paint a region a solid colour in place (true redaction: the original pixels are gone). */
export function fillRectInPlace(img: RawImage, rect: Rect, rgb: readonly [number, number, number]): void {
  const r = clampRect(rect, img.width, img.height);
  if (!r) return;
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      const i = (y * img.width + x) * 4;
      img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2]; img.data[i + 3] = 255;
    }
  }
}

/** Largest edge of the result when scaling `width`×`height` down to fit `maxEdge` (never scales up). */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Turn two drag points (image pixels) into a rectangle, optionally locked to an aspect ratio (w / h).
 * The result is clamped to the image.
 */
export function rectFromDrag(a: { x: number; y: number }, b: { x: number; y: number }, width: number, height: number, aspect?: number | null): Rect | null {
  const ax = Math.min(Math.max(a.x, 0), width);
  const ay = Math.min(Math.max(a.y, 0), height);
  let dx = Math.min(Math.max(b.x, 0), width) - ax;
  let dy = Math.min(Math.max(b.y, 0), height) - ay;
  if (aspect && aspect > 0) {
    const sx = dx < 0 ? -1 : 1;
    const sy = dy < 0 ? -1 : 1;
    let w = Math.abs(dx);
    let h = Math.abs(dy);
    if (w / (h || 1) > aspect) w = h * aspect;
    else h = w / aspect;
    // Shrink to stay inside the image when the locked ratio would overflow.
    const maxW = sx > 0 ? width - ax : ax;
    const maxH = sy > 0 ? height - ay : ay;
    const k = Math.min(1, maxW / (w || 1), maxH / (h || 1));
    dx = sx * w * k;
    dy = sy * h * k;
  }
  return clampRect({ x: Math.min(ax, ax + dx), y: Math.min(ay, ay + dy), w: Math.abs(dx), h: Math.abs(dy) }, width, height);
}
