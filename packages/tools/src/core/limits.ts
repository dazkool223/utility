import type { InputKind } from './types';

const MB = 1024 * 1024;

/** Supported Sizes from spec §5. Above these a Restriction is shown and the user may continue. */
export const SUPPORTED_BYTES: Record<Exclude<InputKind, 'none'>, number> = {
  text: 50 * MB,
  image: 200 * MB, // pixel limit is checked separately after decode
  pdf: 500 * MB,
  media: 2 * 1024 * MB,
  binary: 500 * MB,
};

export const SUPPORTED_IMAGE_PIXELS = 50_000_000;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

/** Most a decompressor may produce. A tiny file can expand to gigabytes (a "decompression bomb"), so output is capped. */
export const MAX_DECOMPRESSED_BYTES = 512 * MB;

/** Text longer than this is not scanned by Smart Paste, so a huge paste cannot freeze the page. */
export const MAX_DETECT_CHARS = 1_000_000;

/**
 * Reads a stream into chunks, stopping with an error as soon as more than `max` bytes have arrived.
 * `tooBig` builds the message so each Tool can word it for its own users.
 */
export async function readStreamCapped(stream: ReadableStream<Uint8Array>, max: number, tooBig: (max: number) => Error): Promise<Uint8Array[]> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return chunks;
    total += value.byteLength;
    if (total > max) {
      void reader.cancel().catch(() => {});
      throw tooBig(max);
    }
    chunks.push(value);
  }
}

/** Returns a Restriction message if `bytes` exceeds the Supported Size for `kind`, else null. */
export function sizeRestriction(kind: InputKind, bytes: number): string | null {
  if (kind === 'none') return null;
  const limit = SUPPORTED_BYTES[kind];
  if (bytes <= limit) return null;
  return `This input is ${formatBytes(bytes)}. This Tool is tested up to ${formatBytes(limit)}; larger inputs may be slow or run out of memory.`;
}
