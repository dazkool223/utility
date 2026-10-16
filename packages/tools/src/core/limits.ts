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

/** Returns a Restriction message if `bytes` exceeds the Supported Size for `kind`, else null. */
export function sizeRestriction(kind: InputKind, bytes: number): string | null {
  if (kind === 'none') return null;
  const limit = SUPPORTED_BYTES[kind];
  if (bytes <= limit) return null;
  return `This input is ${formatBytes(bytes)}. This Tool is tested up to ${formatBytes(limit)}; larger inputs may be slow or run out of memory.`;
}
