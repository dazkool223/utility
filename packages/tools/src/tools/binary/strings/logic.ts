import { ToolError } from '@/core/types';

export type StringEncoding = 'ascii' | 'utf16le' | 'utf16be';

export interface StringsOptions {
  minLength: number;
  encodings: StringEncoding[];
  /** Stop after this many strings so a huge binary cannot flood the page. */
  maxResults: number;
}

export const DEFAULT_STRINGS: StringsOptions = { minLength: 4, encodings: ['ascii', 'utf16le'], maxResults: 100_000 };

export interface FoundString {
  offset: number;
  encoding: StringEncoding;
  text: string;
}

const isPrintable = (b: number) => (b >= 0x20 && b <= 0x7e) || b === 0x09;

/**
 * Incremental scanner, so files of any size can be read in chunks. Like the Unix `strings` tool it finds runs of
 * printable ASCII, and optionally UTF-16 text at either byte alignment.
 */
export class StringScanner {
  readonly found: FoundString[] = [];
  truncated = false;
  private pos = 0;
  private asciiStart = -1;
  private asciiChars: string[] = [];
  private wide: Array<{ enc: 'utf16le' | 'utf16be'; phase: 0 | 1; first: number; start: number; chars: string[] }> = [];

  constructor(private readonly o: StringsOptions) {
    if (!Number.isInteger(o.minLength) || o.minLength < 1) throw new ToolError('The minimum length must be a whole number of at least 1.');
    if (!o.encodings.length) throw new ToolError('Choose at least one encoding to search for.');
    for (const enc of o.encodings) {
      if (enc === 'ascii') continue;
      for (const phase of [0, 1] as const) this.wide.push({ enc, phase, first: -1, start: -1, chars: [] });
    }
  }

  private emit(encoding: StringEncoding, offset: number, chars: string[]) {
    if (chars.length >= this.o.minLength) {
      if (this.found.length >= this.o.maxResults) this.truncated = true;
      else this.found.push({ offset, encoding, text: chars.join('') });
    }
  }

  push(chunk: Uint8Array): void {
    const wantAscii = this.o.encodings.includes('ascii');
    for (let i = 0; i < chunk.length; i++) {
      const b = chunk[i]!;
      const at = this.pos + i;
      if (wantAscii) {
        if (isPrintable(b)) {
          if (this.asciiStart < 0) this.asciiStart = at;
          this.asciiChars.push(String.fromCharCode(b));
        } else if (this.asciiStart >= 0) {
          this.emit('ascii', this.asciiStart, this.asciiChars);
          this.asciiStart = -1;
          this.asciiChars = [];
        }
      }
      for (const w of this.wide) {
        if ((at & 1) === w.phase) {
          w.first = b;
          continue;
        }
        const [zero, ch] = w.enc === 'utf16le' ? [b, w.first] : [w.first, b];
        if (zero === 0 && w.first >= 0 && isPrintable(ch)) {
          if (w.start < 0) w.start = at - 1;
          w.chars.push(String.fromCharCode(ch));
        } else if (w.start >= 0) {
          this.emit(w.enc, w.start, w.chars);
          w.start = -1;
          w.chars = [];
        }
        w.first = -1;
      }
    }
    this.pos += chunk.length;
  }

  finish(): FoundString[] {
    if (this.asciiStart >= 0) this.emit('ascii', this.asciiStart, this.asciiChars);
    for (const w of this.wide) if (w.start >= 0) this.emit(w.enc, w.start, w.chars);
    this.asciiStart = -1;
    for (const w of this.wide) w.start = -1;
    this.found.sort((a, b) => a.offset - b.offset);
    return this.found;
  }
}

export function extractStrings(bytes: Uint8Array, o: StringsOptions = DEFAULT_STRINGS): { strings: FoundString[]; truncated: boolean } {
  const s = new StringScanner(o);
  s.push(bytes);
  return { strings: s.finish(), truncated: s.truncated };
}

/** Read a Blob in chunks so large files never sit in memory whole. */
export async function extractStringsFromBlob(blob: Blob, o: StringsOptions = DEFAULT_STRINGS, onProgress?: (fraction: number) => void): Promise<{ strings: FoundString[]; truncated: boolean }> {
  const s = new StringScanner(o);
  const CHUNK = 4 * 1024 * 1024;
  for (let off = 0; off < blob.size; off += CHUNK) {
    s.push(new Uint8Array(await blob.slice(off, off + CHUNK).arrayBuffer()));
    onProgress?.(Math.min(1, (off + CHUNK) / blob.size));
  }
  return { strings: s.finish(), truncated: s.truncated };
}

const TAG: Record<StringEncoding, string> = { ascii: '', utf16le: ' [utf-16le]', utf16be: ' [utf-16be]' };

/** One string per line, with its hexadecimal offset when `offsets` is set. */
export function formatStrings(list: readonly FoundString[], offsets: boolean): string {
  return list.map((f) => (offsets ? `${f.offset.toString(16).padStart(8, '0')}  ${f.text}${TAG[f.encoding]}` : f.text)).join('\n');
}
