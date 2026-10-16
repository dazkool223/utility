import { ToolError } from '@/core/types';
import { parseHexColour, type RawImage } from '../_lib/formats';
import { cloneImage, fillRectInPlace, pixelateInPlace } from '../_lib/pixels';
import { tileOrigins, validateAnnotation, type Annotation, type TextNote, type Watermark } from './logic';

/** Browser-only drawing (needs OffscreenCanvas for text). Everything else is in pixels.ts and logic.ts. */

function fontFor(a: TextNote | Watermark): string {
  return `${a.bold ? 'bold ' : ''}${Math.round(a.size)}px system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
}

function drawText(ctx: OffscreenCanvasRenderingContext2D, a: TextNote) {
  ctx.save();
  ctx.globalAlpha = a.opacity / 100;
  ctx.fillStyle = a.colour;
  ctx.font = fontFor(a);
  ctx.textBaseline = 'top';
  a.text.split('\n').forEach((line, i) => ctx.fillText(line, a.x, a.y + i * a.size * 1.2));
  ctx.restore();
}

function drawWatermark(ctx: OffscreenCanvasRenderingContext2D, a: Watermark, width: number, height: number) {
  ctx.save();
  ctx.globalAlpha = a.opacity / 100;
  ctx.fillStyle = a.colour;
  ctx.font = fontFor(a);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const label = a.text.replace(/\s*\n\s*/g, ' ');
  const textW = ctx.measureText(label).width;
  const cellW = textW + a.size * 2;
  const cellH = a.size * 3;
  // Tile a square big enough to still cover the corners once rotated, around the picture's centre.
  const reach = Math.hypot(width, height);
  ctx.translate(width / 2, height / 2);
  ctx.rotate((a.angle * Math.PI) / 180);
  for (const [ox, oy] of tileOrigins(reach, reach, cellW, cellH)) ctx.fillText(label, ox - reach / 2 + cellW / 2, oy - reach / 2 + cellH / 2);
  ctx.restore();
}

/**
 * Apply annotations to a copy of `img`. Pixelate and cover areas change the picture itself first (so the
 * original pixels under them are gone), then text and watermarks are drawn on top.
 */
export function renderAnnotations(img: RawImage, annotations: readonly Annotation[]): RawImage {
  for (const a of annotations) validateAnnotation(a, img.width, img.height);
  const out = cloneImage(img);
  for (const a of annotations) {
    if (a.kind === 'pixelate') pixelateInPlace(out, a.rect, a.block);
    else if (a.kind === 'redact') fillRectInPlace(out, a.rect, parseHexColour(a.colour));
  }
  const drawn = annotations.filter((a): a is TextNote | Watermark => a.kind === 'text' || a.kind === 'watermark');
  if (!drawn.length) return out;
  if (typeof OffscreenCanvas === 'undefined') throw new ToolError('This browser cannot draw text onto pictures. Pixelate and cover still work.');
  const canvas = new OffscreenCanvas(out.width, out.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new ToolError('This browser could not create a drawing surface.');
  ctx.putImageData(new ImageData(out.data as Uint8ClampedArray<ArrayBuffer>, out.width, out.height), 0, 0);
  for (const a of drawn) {
    if (a.kind === 'text') drawText(ctx, a);
    else drawWatermark(ctx, a, out.width, out.height);
  }
  const d = ctx.getImageData(0, 0, out.width, out.height);
  return { data: d.data, width: d.width, height: d.height };
}
