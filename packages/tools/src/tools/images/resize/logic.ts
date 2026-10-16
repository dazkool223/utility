import { ToolError } from '@/core/types';

export type ResizeMode = 'pixels' | 'percent';

export interface ResizeRequest {
  mode: ResizeMode;
  width: number;
  height: number;
  percent: number;
}

export const MAX_EDGE = 16384;
export const MAX_OUTPUT_PIXELS = 150_000_000;

/** Height that keeps the source's shape when the width is `width`. */
export function linkedHeight(srcWidth: number, srcHeight: number, width: number): number {
  return Math.max(1, Math.round((srcHeight * width) / srcWidth));
}

/** Width that keeps the source's shape when the height is `height`. */
export function linkedWidth(srcWidth: number, srcHeight: number, height: number): number {
  return Math.max(1, Math.round((srcWidth * height) / srcHeight));
}

/** Final pixel size for a request, or a ToolError saying what to change. */
export function targetSize(srcWidth: number, srcHeight: number, r: ResizeRequest): { width: number; height: number } {
  let width: number;
  let height: number;
  if (r.mode === 'percent') {
    if (!Number.isFinite(r.percent) || r.percent <= 0) throw new ToolError('The scale must be more than 0%.');
    width = Math.max(1, Math.round((srcWidth * r.percent) / 100));
    height = Math.max(1, Math.round((srcHeight * r.percent) / 100));
  } else {
    if (!Number.isFinite(r.width) || !Number.isFinite(r.height) || r.width < 1 || r.height < 1) throw new ToolError('Width and height must each be at least 1 pixel.');
    width = Math.round(r.width);
    height = Math.round(r.height);
  }
  if (width > MAX_EDGE || height > MAX_EDGE) throw new ToolError(`Each side can be at most ${MAX_EDGE.toLocaleString()} pixels.`);
  if (width * height > MAX_OUTPUT_PIXELS) {
    throw new ToolError(`That would be ${((width * height) / 1_000_000).toFixed(0)} megapixels, more than this Tool can make (${MAX_OUTPUT_PIXELS / 1_000_000}). Choose a smaller size.`);
  }
  return { width, height };
}

/** Longest-side presets offered as one-click sizes. */
export const EDGE_PRESETS = [3840, 2560, 1920, 1280, 1024, 800, 640, 320] as const;

/** Size whose longest side is `edge`, keeping the source's shape. */
export function fitEdge(srcWidth: number, srcHeight: number, edge: number): { width: number; height: number } {
  const scale = edge / Math.max(srcWidth, srcHeight);
  return { width: Math.max(1, Math.round(srcWidth * scale)), height: Math.max(1, Math.round(srcHeight * scale)) };
}
