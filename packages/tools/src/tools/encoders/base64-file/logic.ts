import { ToolError } from '@/core/types';
import { base64ToBytes } from '../base64/logic';

export type OutputStyle = 'data-uri' | 'base64' | 'css' | 'html';

/** Guess a MIME type from the first bytes of a file. */
export function sniffMime(bytes: Uint8Array): string {
  const ascii = (from: number, len: number) => String.fromCharCode(...bytes.subarray(from, from + len));
  if (bytes[0] === 0x89 && ascii(1, 3) === 'PNG') return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (ascii(0, 3) === 'GIF') return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'image/webp';
  if (ascii(0, 5) === '%PDF-') return 'application/pdf';
  if (bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0) return 'image/x-icon';
  if (ascii(4, 4) === 'ftyp') return /avif/.test(ascii(8, 4)) ? 'image/avif' : 'video/mp4';
  const head = new TextDecoder().decode(bytes.subarray(0, 300)).trimStart();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return 'image/svg+xml';
  return 'application/octet-stream';
}

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'text/plain': 'txt',
  'application/json': 'json',
};

export function extensionFor(mime: string): string {
  return EXTENSIONS[mime] ?? 'bin';
}

export function formatOutput(dataUri: string, style: OutputStyle): string {
  const i = dataUri.indexOf(',');
  if (style === 'base64') return i >= 0 ? dataUri.slice(i + 1) : dataUri;
  if (style === 'css') return `url("${dataUri}")`;
  if (style === 'html') return `<img src="${dataUri}" alt="">`;
  return dataUri;
}

export interface ParsedBase64 {
  mime: string;
  bytes: Uint8Array;
}

/** Accepts a data URI (data:image/png;base64,...), a CSS url(...), an <img src> or bare Base64 / Base64URL. */
export function parseBase64Input(input: string): ParsedBase64 {
  let text = input.trim();
  const embedded = /data:([\w.+/-]*)(?:;[\w=.+-]+)*?(;base64)?,([^"')\s]*)/i.exec(text);
  let mime: string | null = null;
  if (embedded) {
    mime = embedded[1] || 'text/plain';
    if (!embedded[2]) {
      const bytes = new TextEncoder().encode(decodeURIComponent(embedded[3]!));
      return { mime, bytes };
    }
    text = embedded[3]!;
  }
  const clean = text.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  if (!clean) throw new ToolError('Paste a data URI or Base64 text.');
  if (!/^[A-Za-z0-9+/]+$/.test(clean)) throw new ToolError('This is not valid Base64: only A-Z, a-z, 0-9, +, /, - and _ are allowed.');
  if (clean.length % 4 === 1) throw new ToolError('This is not valid Base64: the length is wrong (a character is missing or extra).');
  const bytes = base64ToBytes(clean + '='.repeat((4 - (clean.length % 4)) % 4));
  return { mime: !mime || mime === 'application/octet-stream' ? sniffMime(bytes) : mime, bytes };
}
