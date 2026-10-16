import { ToolError } from '@/core/types';

export type UnicodeFormat = 'u4' | 'braces' | 'codepoints' | 'html';

export const FORMATS: ReadonlyArray<{ value: UnicodeFormat; label: string }> = [
  { value: 'u4', label: 'JavaScript / Java (\\uXXXX)' },
  { value: 'braces', label: 'ES6 code point (\\u{X})' },
  { value: 'codepoints', label: 'Code points (U+XXXX)' },
  { value: 'html', label: 'HTML hex (&#xX;)' },
];

const hex4 = (n: number) => n.toString(16).toUpperCase().padStart(4, '0');

export function escapeUnicode(text: string, format: UnicodeFormat, onlyNonAscii: boolean): string {
  if (format === 'codepoints') {
    return Array.from(text, (ch) => 'U+' + hex4(ch.codePointAt(0)!)).join(' ');
  }
  let out = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (onlyNonAscii && cp < 0x80) {
      out += ch;
      continue;
    }
    if (format === 'u4') {
      if (cp > 0xffff) out += '\\u' + hex4(ch.charCodeAt(0)) + '\\u' + hex4(ch.charCodeAt(1));
      else out += '\\u' + hex4(cp);
    } else if (format === 'braces') out += '\\u{' + cp.toString(16).toUpperCase() + '}';
    else out += '&#x' + cp.toString(16).toUpperCase() + ';';
  }
  return out;
}

function fromCodePoint(cp: number, token: string): string {
  if (!Number.isInteger(cp) || cp < 0 || cp > 0x10ffff) throw new ToolError(`${token} is not a valid Unicode code point (the maximum is U+10FFFF).`);
  return String.fromCodePoint(cp);
}

/** Decodes \uXXXX, \u{X}, \UXXXXXXXX, U+XXXX, &#xX; and &#N; wherever they appear. */
export function unescapeUnicode(input: string): string {
  return input.replace(/(U\+[0-9a-fA-F]{4,6})[ \t]+(?=U\+)/g, '$1').replace(/\\u\{([0-9a-fA-F]+)\}|\\U([0-9a-fA-F]{8})|\\u([0-9a-fA-F]{4})|U\+([0-9a-fA-F]{4,6})|&#x([0-9a-fA-F]+);|&#(\d+);/g, (all, a, b, c, d, e, f) => {
    if (c) return String.fromCharCode(parseInt(c, 16));
    const hexv = a ?? b ?? d ?? e;
    return fromCodePoint(hexv ? parseInt(hexv, 16) : parseInt(f, 10), all);
  });
}

/** One line per code point: "U+0041  A". */
export function listCodePoints(text: string): string {
  return Array.from(text, (ch) => {
    const cp = ch.codePointAt(0)!;
    const shown = cp < 0x20 || cp === 0x7f ? '(control)' : ch === ' ' ? '(space)' : ch;
    return `U+${hex4(cp)}  ${shown}  UTF-8: ${Array.from(new TextEncoder().encode(ch), (b) => b.toString(16).padStart(2, '0')).join(' ')}`;
  }).join('\n');
}
