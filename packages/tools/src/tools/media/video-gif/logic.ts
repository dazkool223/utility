import { ToolError } from '@/core/types';

export interface GifOptions {
  fps: number;
  /** Output width in pixels; the height follows the video's shape. */
  width: number;
  /** Seconds. */
  start: number;
  /** Seconds; null means "to the end" (capped by MAX_FRAMES). */
  end: number | null;
  /** 2–256 colours per frame. */
  colours: number;
  /** Play once instead of looping forever. */
  playOnce: boolean;
}

export const DEFAULT_GIF_OPTIONS: GifOptions = { fps: 12, width: 480, start: 0, end: null, colours: 256, playOnce: false };

/** A GIF this long is already large; more frames are cut off rather than risking an out-of-memory tab. */
export const MAX_FRAMES = 600;
export const WIDTH_CHOICES = [160, 240, 320, 480, 640, 800] as const;
export const FPS_CHOICES = [5, 8, 10, 12, 15, 20, 25] as const;

/** Seconds at which to grab frames. `end` defaults to the video's end, and the list is capped at MAX_FRAMES. */
export function planTimestamps(start: number, end: number | null, duration: number, fps: number): number[] {
  if (!Number.isFinite(start) || start < 0) throw new ToolError('The start time must be 0 or more seconds.');
  if (!(fps > 0)) throw new ToolError('Frames per second must be more than 0.');
  if (start >= duration) throw new ToolError(`The start time (${start}s) is at or after the end of the video (${duration.toFixed(2)}s).`);
  const stop = Math.min(end ?? duration, duration);
  if (stop <= start) throw new ToolError('The end time must be after the start time.');
  const count = Math.floor((stop - start) * fps);
  if (count < 1) throw new ToolError('That range is shorter than one frame. Lengthen it or raise the frame rate.');
  const frames = Math.min(count, MAX_FRAMES);
  return Array.from({ length: frames }, (_, i) => start + i / fps);
}

/** Output size for a target width, keeping the aspect ratio and never scaling up. */
export function gifSize(srcWidth: number, srcHeight: number, targetWidth: number): { width: number; height: number } {
  const width = Math.max(1, Math.min(Math.round(targetWidth), srcWidth));
  return { width, height: Math.max(1, Math.round((srcHeight * width) / srcWidth)) };
}

export function outputName(inputName: string): string {
  return `${inputName.replace(/\.[^./\\]+$/, '') || 'video'}.gif`;
}

/** Parses "90", "1:30", "1:02:03.5" into seconds. Returns null for blank input and NaN for garbage. */
export function parseTime(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const parts = t.split(':');
  if (parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return Number.NaN;
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

export interface GifResult {
  blob: Blob;
  name: string;
  width: number;
  height: number;
  frames: number;
  /** True when the clip was cut short to stay within MAX_FRAMES. */
  truncated: boolean;
}

type Ctx2d = { getImageData(x: number, y: number, w: number, h: number): ImageData };

/** Turns a video file into an animated GIF. Frames are decoded by the browser (WebCodecs) and encoded by gifenc on this device. */
export async function makeGif(file: Blob, name: string, o: GifOptions, onProgress?: (fraction: number) => void, signal?: { cancelled: boolean }): Promise<GifResult> {
  const mb = await import('mediabunny');
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
  const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
  try {
    let track;
    try {
      track = await input.getPrimaryVideoTrack();
    } catch (e) {
      if (e instanceof Error && e.name === 'UnsupportedInputFormatError') throw new ToolError('This does not look like a video file this Tool can read.');
      throw new ToolError('The file could not be read. It may be damaged or truncated.');
    }
    if (!track) throw new ToolError('This file has no video track.');
    if (!(await track.canDecode())) throw new ToolError(`This browser cannot decode the video in this file${track.codec ? ` (${track.codec})` : ''}. Try Chrome, Edge or Safari for H.264 video.`);
    const duration = await input.computeDuration();
    const times = planTimestamps(o.start, o.end, duration, o.fps);
    const wanted = Math.floor((Math.min(o.end ?? duration, duration) - o.start) * o.fps);
    const size = gifSize(track.displayWidth, track.displayHeight, o.width);
    const sink = new mb.CanvasSink(track, { width: size.width, height: size.height, fit: 'fill' });
    const gif = GIFEncoder();
    const delay = Math.max(20, Math.round(1000 / o.fps));
    let written = 0;
    for await (const frame of sink.canvasesAtTimestamps(times)) {
      if (signal?.cancelled) throw new ToolError('Cancelled.');
      if (frame) {
        const ctx = frame.canvas.getContext('2d') as unknown as Ctx2d | null;
        if (!ctx) throw new ToolError('This browser could not read the video frames.');
        const rgba = ctx.getImageData(0, 0, size.width, size.height).data;
        const palette = quantize(rgba, Math.min(256, Math.max(2, Math.round(o.colours))));
        gif.writeFrame(applyPalette(rgba, palette), size.width, size.height, { palette, delay, repeat: o.playOnce ? -1 : 0, first: written === 0 });
        written++;
      }
      onProgress?.(Math.min(1, (written + 1) / times.length));
    }
    if (!written) throw new ToolError('No frames could be read from that range of the video.');
    gif.finish();
    return { blob: new Blob([gif.bytes() as Uint8Array<ArrayBuffer>], { type: 'image/gif' }), name: outputName(name), width: size.width, height: size.height, frames: written, truncated: wanted > times.length };
  } finally {
    input.dispose();
  }
}
