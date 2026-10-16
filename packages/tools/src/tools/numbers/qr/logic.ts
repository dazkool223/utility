import { ToolError } from '@/core/types';

export type EcLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrOptions {
  ec: EcLevel;
  /** Output width in pixels (PNG) / viewBox scaling (SVG). */
  size: number;
  margin: number;
  dark: string;
  light: string;
}

export const DEFAULT_QR: QrOptions = { ec: 'M', size: 320, margin: 2, dark: '#000000', light: '#ffffff' };

function check(text: string, o: QrOptions): void {
  if (!text) throw new ToolError('Enter the text or link to put in the QR code.');
  if (!Number.isInteger(o.size) || o.size < 64 || o.size > 4096) throw new ToolError('Size must be from 64 to 4096 pixels.');
  if (!Number.isInteger(o.margin) || o.margin < 0 || o.margin > 20) throw new ToolError('Margin must be from 0 to 20 modules.');
  if (!/^#[0-9a-f]{6}$/i.test(o.dark) || !/^#[0-9a-f]{6}$/i.test(o.light)) throw new ToolError('Colours must be 6-digit hex values like #000000.');
}

function tooBig(e: unknown): never {
  const m = e instanceof Error ? e.message : String(e);
  if (/too big|capacity|cannot contain/i.test(m)) throw new ToolError('This text is too long for a QR code at this error-correction level. Shorten it or choose a lower level (L holds the most).');
  throw new ToolError('Could not create the QR code: ' + m);
}

export async function qrMatrix(text: string, ec: EcLevel): Promise<{ size: number; version: number }> {
  const QR = await import('qrcode');
  try {
    const q = QR.create(text, { errorCorrectionLevel: ec });
    return { size: q.modules.size, version: q.version };
  } catch (e) {
    return tooBig(e);
  }
}

export async function qrSvg(text: string, o: QrOptions = DEFAULT_QR): Promise<string> {
  check(text, o);
  const QR = await import('qrcode');
  try {
    return await QR.toString(text, { type: 'svg', errorCorrectionLevel: o.ec, margin: o.margin, width: o.size, color: { dark: o.dark, light: o.light } });
  } catch (e) {
    return tooBig(e);
  }
}

/** PNG as a data URL. Uses a canvas in browsers. */
export async function qrPngDataUrl(text: string, o: QrOptions = DEFAULT_QR): Promise<string> {
  check(text, o);
  const QR = await import('qrcode');
  try {
    return await QR.toDataURL(text, { errorCorrectionLevel: o.ec, margin: o.margin, width: o.size, color: { dark: o.dark, light: o.light } });
  } catch (e) {
    return tooBig(e);
  }
}

export function dataUrlToBlob(url: string): Blob {
  const [head, b64] = url.split(',') as [string, string];
  const type = /data:([^;]+)/.exec(head)?.[1] ?? 'image/png';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}
