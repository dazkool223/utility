/** Pure helpers for the Background Remover. The engine itself lives in worker.ts. */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** `#rgb` or `#rrggbb` (the leading `#` is optional). Returns null for anything else. */
export function parseHexColor(text: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text.trim());
  if (!m) return null;
  let hex = m[1]!;
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

/** `photo.JPG` → `photo-no-background.png`. */
export function cutoutName(inputName: string): string {
  const base = inputName.replace(/\.[^./\\]+$/, '') || 'image';
  return `${base}-no-background.png`;
}

export interface Progress {
  label: string;
  /** 0–1, or undefined when the engine gave no usable total. */
  fraction?: number;
}

const COMPUTE_LABELS: Record<string, string> = {
  decode: 'Reading the picture…',
  inference: 'Finding the subject…',
  mask: 'Cutting out the background…',
  encode: 'Saving the result…',
};

/**
 * Turns the engine's progress events (`fetch:/models/isnet` in bytes, `compute:inference` in steps of 4)
 * into text and a fraction for the progress line.
 */
export function describeProgress(key: string, current: number, total: number): Progress {
  const fraction = total > 0 ? Math.min(1, Math.max(0, current / total)) : undefined;
  if (key.startsWith('fetch:')) return { label: key.includes('/models/') ? 'Loading the model (first use only)…' : 'Loading the engine…', fraction };
  const step = key.startsWith('compute:') ? key.slice('compute:'.length) : key;
  return { label: COMPUTE_LABELS[step] ?? 'Working…', fraction };
}
