import type { EncodeSpec } from './codecs';
import { buildSpec } from '../convert/logic';
import { resolveOutputFormat, type RasterFormat, type SniffedFormat } from './formats';

/** The "save as" choice shared by the image Tools that edit one picture. */
export interface OutputChoice {
  /** `same` keeps PNG, JPEG and WebP; any other input format is saved as PNG. */
  format: RasterFormat | 'same';
  /** 1–100. Only used by lossy formats. */
  quality: number;
  lossless: boolean;
  /** Fill for transparent areas when saving as JPEG. */
  background: string;
}

export const DEFAULT_OUTPUT: OutputChoice = { format: 'same', quality: 85, lossless: false, background: '#ffffff' };

/** The encoder request and concrete format for a choice, given what the input file was. */
export function outputSpec(choice: OutputChoice, input: SniffedFormat): { spec: EncodeSpec; format: RasterFormat } {
  const format = resolveOutputFormat(choice.format, input);
  return { format, spec: buildSpec({ format, quality: choice.quality, lossless: choice.lossless, background: choice.background, avifSpeed: 6 }) };
}
