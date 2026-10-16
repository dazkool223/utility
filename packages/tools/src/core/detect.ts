/** Smart Paste: recognise what pasted text or a dropped file is. Runs locally. */
import { MAX_DETECT_CHARS } from './limits';

export type TextKind =
  | 'jwt'
  | 'json'
  | 'yaml'
  | 'xml'
  | 'csv'
  | 'base64'
  | 'timestamp'
  | 'uuid'
  | 'url'
  | 'url-encoded'
  | 'cron'
  | 'pem-cert'
  | 'pem-csr'
  | 'pem-key'
  | 'hex'
  | 'color'
  | 'ip'
  | 'cidr'
  | 'html'
  | 'sql'
  | 'curl'
  | 'markdown'
  | 'text';

export type FileKind = 'pdf' | 'image' | 'zip' | 'gzip' | 'tar' | 'video' | 'audio' | 'sqlite' | 'xlsx' | 'docx' | 'file';

export type DetectKind = TextKind | FileKind;

const JWT = /^[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CRON_FIELD = /^(\*|\?|[0-9A-Za-z,\-*/#LW]+)$/;
const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FN_COLOR = /^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(.+\)$/i;

function tryJson(s: string): boolean {
  const c = s[0];
  if (c !== '{' && c !== '[') return false;
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

function base64urlDecodes(part: string): boolean {
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    return atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)).trimStart().startsWith('{');
  } catch {
    return false;
  }
}

/** Returns the most likely kinds for `input`, best first. Always ends with 'text'. */
export function detectText(raw: string): TextKind[] {
  if (raw.length > MAX_DETECT_CHARS) return ['text']; // too big to scan on the page thread
  const s = raw.trim();
  const kinds: TextKind[] = [];
  if (!s) return ['text'];
  const singleLine = !s.includes('\n');

  if (s.startsWith('-----BEGIN')) {
    if (/BEGIN CERTIFICATE/.test(s)) kinds.push('pem-cert');
    else if (/BEGIN (NEW )?CERTIFICATE REQUEST/.test(s)) kinds.push('pem-csr');
    else if (/PRIVATE KEY|PUBLIC KEY/.test(s)) kinds.push('pem-key');
  }
  if (singleLine && JWT.test(s) && base64urlDecodes(s.split('.')[0]!)) kinds.push('jwt');
  if (tryJson(s)) kinds.push('json');
  if (singleLine && UUID.test(s)) kinds.push('uuid');
  if (singleLine && /^\d{9,19}$/.test(s)) kinds.push('timestamp');
  if (singleLine && /^curl\s/i.test(s)) kinds.push('curl');
  if (/^curl\s/i.test(s) && !kinds.includes('curl')) kinds.push('curl');
  if (singleLine && /^https?:\/\/\S+$/i.test(s)) kinds.push('url');
  if (singleLine && /%[0-9A-F]{2}/i.test(s) && !/\s/.test(s)) kinds.push('url-encoded');
  if (singleLine && IPV4.test(s)) kinds.push('ip');
  if (singleLine && /^[\d.]+\/\d{1,2}$/.test(s) && IPV4.test(s.split('/')[0]!)) kinds.push('cidr');
  if (singleLine && (HEX_COLOR.test(s) || FN_COLOR.test(s))) kinds.push('color');
  if (singleLine) {
    const fields = s.split(/\s+/);
    if (fields.length >= 5 && fields.length <= 7 && fields.every((f) => CRON_FIELD.test(f)) && fields.some((f) => f.includes('*') || /^\d+$/.test(f)) && !fields.every((f) => /^\d+$/.test(f)))
      kinds.push('cron');
  }
  if (s.startsWith('<')) {
    if (/^<!doctype html|<html[\s>]/i.test(s)) kinds.push('html');
    else if (/^<(\?xml|[A-Za-z_][\w.-]*[\s>/])/.test(s) && /<\/[\w.-]+>\s*$|\/>\s*$/.test(s)) kinds.push('xml');
  }
  if (/^\s*(select|insert|update|delete|create|alter|with)\s/i.test(s)) kinds.push('sql');
  if (singleLine && s.length >= 8 && /^[0-9a-f]+$/i.test(s) && s.length % 2 === 0) kinds.push('hex');
  if (singleLine && s.length >= 8 && s.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(s) && !/^\d+$/.test(s) && !kinds.includes('hex'))
    kinds.push('base64');
  if (!kinds.includes('json') && !singleLine && /^[\w"' -]+:\s/m.test(s) && !s.startsWith('{') && !s.startsWith('<')) kinds.push('yaml');
  if (!singleLine) {
    const lines = s.split('\n').slice(0, 5);
    const commas = lines.map((l) => (l.match(/,/g) ?? []).length);
    if (commas[0]! > 0 && commas.every((c) => c === commas[0])) kinds.push('csv');
  }
  if (/^#{1,6}\s|^\s*[-*]\s|\[.+\]\(.+\)/m.test(s) && !kinds.includes('yaml')) kinds.push('markdown');
  kinds.push('text');
  return kinds;
}

/** Identify a file from its magic bytes, falling back to MIME type. */
export async function detectFile(file: Blob & { name?: string }): Promise<FileKind> {
  const head = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  const ascii = (from: number, len: number) => String.fromCharCode(...head.subarray(from, from + len));
  if (ascii(0, 5) === '%PDF-') return 'pdf';
  if (head[0] === 0x1f && head[1] === 0x8b) return 'gzip';
  if (ascii(0, 15) === 'SQLite format 3') return 'sqlite';
  if (head[0] === 0x50 && head[1] === 0x4b) {
    const name = file.name?.toLowerCase() ?? '';
    if (name.endsWith('.xlsx')) return 'xlsx';
    if (name.endsWith('.docx')) return 'docx';
    return 'zip';
  }
  if (ascii(257, 5) === 'ustar') return 'tar';
  const type = file.type;
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (head[0] === 0x89 && ascii(1, 3) === 'PNG') return 'image';
  if (head[0] === 0xff && head[1] === 0xd8) return 'image';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'image';
  if (ascii(0, 3) === 'GIF') return 'image';
  if (ascii(4, 4) === 'ftyp') return /avi|heic|heix|mif1/.test(ascii(8, 4)) ? 'image' : 'video';
  return 'file';
}
