import { Gunzip, Unzlib } from 'fflate';
import { MAX_DECOMPRESSED_BYTES } from '@/core/limits';
import { ToolError } from '@/core/types';

/** What we know about a value while peeling layers of encoding. */
interface State {
  bytes: Uint8Array;
  /** The bytes as UTF-8 text, or null when they are not valid UTF-8. */
  text: string | null;
}

interface Op {
  name: string;
  run: (s: State) => State | null;
}

export interface MagicResult {
  /** Operations applied, in order, e.g. ["From Base64", "Gunzip"]. */
  steps: string[];
  /** Decoded text when the result is text. */
  text: string | null;
  byteLength: number;
  /** File type when the result is recognisably a known binary format. */
  fileType: string | null;
  /** 0 to 1: how much the result looks like something meaningful. */
  score: number;
}

const utf8 = new TextDecoder('utf-8', { fatal: true });
const encoder = new TextEncoder();

function toState(bytes: Uint8Array): State {
  let text: string | null = null;
  try {
    text = utf8.decode(bytes);
  } catch {
    text = null;
  }
  return { bytes, text };
}

const fromText = (s: string): State => ({ bytes: encoder.encode(s), text: s });

const SIGNATURES: Array<[string, number[]]> = [
  ['PNG image', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  ['JPEG image', [0xff, 0xd8, 0xff]],
  ['GIF image', [0x47, 0x49, 0x46, 0x38]],
  ['PDF document', [0x25, 0x50, 0x44, 0x46, 0x2d]],
  ['ZIP archive', [0x50, 0x4b, 0x03, 0x04]],
  ['gzip data', [0x1f, 0x8b]],
  ['ELF executable', [0x7f, 0x45, 0x4c, 0x46]],
  ['Windows executable (PE)', [0x4d, 0x5a]],
  ['WebAssembly module', [0x00, 0x61, 0x73, 0x6d]],
  ['SQLite database', [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66]],
  ['7-Zip archive', [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]],
  ['RAR archive', [0x52, 0x61, 0x72, 0x21]],
  ['BMP image', [0x42, 0x4d]],
  ['WebP image', [0x52, 0x49, 0x46, 0x46]],
  ['zlib data', [0x78, 0x9c]],
  ['Java class file', [0xca, 0xfe, 0xba, 0xbe]],
];

export function detectFileType(b: Uint8Array): string | null {
  for (const [name, sig] of SIGNATURES) {
    if (b.length >= sig.length && sig.every((v, i) => b[i] === v)) {
      // Two-byte signatures also match plain text by accident; require a little more evidence.
      if (sig.length <= 2 && b.length < 8) continue;
      if (name === 'Windows executable (PE)' || name === 'BMP image' || name === 'zlib data') {
        if (b.length < 16) continue;
      }
      return name;
    }
  }
  return null;
}

const COMMON_WORDS = new Set(
  'the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were has had been very hello world'.split(' '),
);

const englishRatio = (s: string): number => {
  const words = s.toLowerCase().match(/[a-z']+/g);
  if (!words?.length) return 0;
  return words.filter((w) => COMMON_WORDS.has(w)).length / words.length;
};

const looksEncoded = (s: string): boolean => {
  const t = s.trim();
  return t.length >= 8 && !/\s/.test(t) && (/^[A-Za-z0-9+/=_-]+$/.test(t) || /^(0x)?[0-9a-fA-F:]+$/.test(t));
};

/** How meaningful a piece of text looks, from 0 to 1. */
export function textScore(s: string): number {
  if (!s) return 0;
  let printable = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if ((c >= 32 && c < 127) || c === 9 || c === 10 || c === 13 || (c >= 160 && c !== 0xfffd)) printable++;
  }
  const length = [...s].length;
  const p = printable / length;
  if (p < 0.9) return p * 0.4;
  if (looksEncoded(s)) return 0.3;
  let score = 0.45 + (p >= 0.99 ? 0.1 : 0);
  const t = s.trim();
  try {
    if (/^[[{]/.test(t) && typeof JSON.parse(t) === 'object') score += 0.3;
  } catch {
    /* not JSON */
  }
  if (/^<[\w!?][\s\S]*>$/.test(t)) score += 0.2;
  if (/^[a-z][a-z0-9+.-]*:\/\/\S+$/i.test(t)) score += 0.25;
  if (/\s/.test(t) && /[aeiou]/i.test(t)) score += 0.1;
  score += Math.min(0.3, englishRatio(s) * 0.5);
  return Math.min(1, score);
}

const B64 = /^[A-Za-z0-9+/_-]+={0,2}$/;
const B32 = /^[A-Z2-7]+=*$/;

const OPS: Op[] = [
  {
    name: 'From Base64',
    run: (s) => {
      const t = s.text?.replace(/\s+/g, '');
      if (!t || t.length < 4 || !B64.test(t)) return null;
      const body = t.replace(/=+$/, '').replace(/-/g, '+').replace(/_/g, '/');
      if (body.length % 4 === 1) return null;
      try {
        const bin = atob(body + '='.repeat((4 - (body.length % 4)) % 4));
        return toState(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      } catch {
        return null;
      }
    },
  },
  {
    name: 'From Base32',
    run: (s) => {
      const t = s.text?.replace(/\s+/g, '').toUpperCase();
      if (!t || t.length < 8 || !B32.test(t)) return null;
      const body = t.replace(/=+$/, '');
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let bits = 0;
      let value = 0;
      const out: number[] = [];
      for (const ch of body) {
        value = (value << 5) | alphabet.indexOf(ch);
        bits += 5;
        if (bits >= 8) {
          out.push((value >>> (bits - 8)) & 0xff);
          bits -= 8;
        }
      }
      return out.length ? toState(Uint8Array.from(out)) : null;
    },
  },
  {
    name: 'From hex',
    run: (s) => {
      const t = s.text?.replace(/0x|\\x|[\s:,-]/gi, '');
      if (!t || t.length < 4 || t.length % 2 || !/^[0-9a-f]+$/i.test(t)) return null;
      return toState(Uint8Array.from(t.match(/../g)!, (h) => parseInt(h, 16)));
    },
  },
  {
    name: 'From binary',
    run: (s) => {
      const t = s.text?.replace(/\s+/g, '');
      if (!t || t.length < 8 || t.length % 8 || !/^[01]+$/.test(t)) return null;
      return toState(Uint8Array.from(t.match(/.{8}/g)!, (b) => parseInt(b, 2)));
    },
  },
  {
    name: 'From decimal bytes',
    run: (s) => {
      const t = s.text?.trim();
      if (!t || !/^\d{1,3}([\s,]+\d{1,3})+$/.test(t)) return null;
      const nums = t.split(/[\s,]+/).map(Number);
      return nums.every((n) => n <= 255) ? toState(Uint8Array.from(nums)) : null;
    },
  },
  {
    name: 'URL decode',
    run: (s) => {
      if (!s.text || !/%[0-9a-f]{2}/i.test(s.text)) return null;
      try {
        return fromText(decodeURIComponent(s.text));
      } catch {
        return null;
      }
    },
  },
  {
    name: 'HTML entities',
    run: (s) => {
      if (!s.text || !/&(#\d+|#x[0-9a-f]+|amp|lt|gt|quot|apos|nbsp);/i.test(s.text)) return null;
      const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
      const out = s.text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_m, e: string) => {
        if (e[0] !== '#') return named[e.toLowerCase()]!;
        const cp = e[1]!.toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : _m;
      });
      return out === s.text ? null : fromText(out);
    },
  },
  {
    name: 'Unescape \\u / \\x',
    run: (s) => {
      if (!s.text || !/\\(u[0-9a-f]{4}|x[0-9a-f]{2}|u\{[0-9a-f]+\})/i.test(s.text)) return null;
      const out = s.text.replace(/\\u\{([0-9a-f]+)\}|\\u([0-9a-f]{4})|\\x([0-9a-f]{2})/gi, (m, a?: string, b?: string, c?: string) => {
        const cp = parseInt((a ?? b ?? c)!, 16);
        return cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
      });
      return out === s.text ? null : fromText(out);
    },
  },
  {
    name: 'Gunzip',
    run: (s) => {
      if (s.bytes[0] !== 0x1f || s.bytes[1] !== 0x8b) return null;
      try {
        return toState(inflateCapped(new Gunzip(), s.bytes));
      } catch {
        return null;
      }
    },
  },
  {
    name: 'Zlib inflate',
    run: (s) => {
      if (s.bytes[0] !== 0x78 || ![0x01, 0x5e, 0x9c, 0xda].includes(s.bytes[1]!)) return null;
      try {
        return toState(inflateCapped(new Unzlib(), s.bytes));
      } catch {
        return null;
      }
    },
  },
  {
    name: 'ROT13',
    run: (s) => {
      if (!s.text || englishRatio(s.text) > 0) return null;
      const out = s.text.replace(/[a-z]/gi, (c) => String.fromCharCode(((c.charCodeAt(0) - (c <= 'Z' ? 65 : 97) + 13) % 26) + (c <= 'Z' ? 65 : 97)));
      return englishRatio(out) >= 0.3 ? fromText(out) : null;
    },
  },
];

/** Inflates with fflate's streaming API so a decompression bomb stops at the cap instead of filling memory. */
function inflateCapped(stream: Gunzip | Unzlib, bytes: Uint8Array): Uint8Array {
  const chunks: Uint8Array[] = [];
  let total = 0;
  stream.ondata = (chunk) => {
    total += chunk.length;
    if (total > MAX_DECOMPRESSED_BYTES) throw new Error('Decompressed data is too large.');
    chunks.push(chunk);
  };
  stream.push(bytes, true);
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

function rate(s: State): { score: number; fileType: string | null } {
  const fileType = detectFileType(s.bytes);
  if (fileType && fileType !== 'gzip data' && fileType !== 'zlib data') return { score: 0.9, fileType };
  return { score: s.text !== null ? textScore(s.text) : 0, fileType };
}

export interface MagicOptions {
  maxDepth: number;
}

/**
 * Try decoding the input through chains of common encodings (up to `maxDepth` layers) and rank
 * what comes out by how meaningful it looks. Everything runs on this device.
 */
export function magic(input: string, o: MagicOptions = { maxDepth: 3 }): { original: number; results: MagicResult[] } {
  if (!input.trim()) throw new ToolError('Paste some encoded or unknown text to analyse.');
  if (!Number.isInteger(o.maxDepth) || o.maxDepth < 1 || o.maxDepth > 5) throw new ToolError('Depth must be a whole number from 1 to 5.');
  const start = fromText(input.trim());
  const original = rate(start).score;
  const seen = new Set<string>([input.trim()]);
  const results: MagicResult[] = [];
  let frontier: Array<{ state: State; steps: string[] }> = [{ state: start, steps: [] }];
  for (let depth = 0; depth < o.maxDepth; depth++) {
    const next: typeof frontier = [];
    for (const { state, steps } of frontier) {
      for (const op of OPS) {
        let out: State | null = null;
        try {
          out = op.run(state);
        } catch {
          out = null;
        }
        if (!out || !out.bytes.length) continue;
        const key = out.text ?? 'b:' + Array.from(out.bytes.subarray(0, 64)).join(',') + out.bytes.length;
        if (seen.has(key)) continue;
        seen.add(key);
        const { score, fileType } = rate(out);
        const chain = [...steps, op.name];
        results.push({ steps: chain, text: out.text, byteLength: out.bytes.length, fileType, score });
        next.push({ state: out, steps: chain });
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  const ranked = results
    .filter((r) => r.score >= 0.6 && (r.score > original + 0.1 || r.fileType))
    .sort((a, b) => b.score - a.score || a.steps.length - b.steps.length);
  return { original, results: ranked.slice(0, 5) };
}

const preview = (s: string, max = 400) => (s.length > max ? s.slice(0, max) + '…' : s);

export function hexPreview(b: Uint8Array, max = 48): string {
  return Array.from(b.subarray(0, max), (x) => x.toString(16).padStart(2, '0')).join(' ') + (b.length > max ? ' …' : '');
}

/** Run Magic and print the ranked guesses as readable text. */
export function magicReport(input: string, o?: MagicOptions): string {
  const { results, original } = magic(input, o);
  if (!results.length) {
    return original >= 0.6
      ? 'The input already looks like readable text, and none of the decoders found anything more meaningful inside it.'
      : 'No known encoding matched. It may be encrypted, compressed in an unsupported way, or not encoded at all.';
  }
  return results
    .map((r, i) => {
      const lines = [`${i + 1}. ${r.steps.join(' → ')}   (confidence ${Math.round(r.score * 100)}%)`];
      if (r.text !== null && !r.fileType) lines.push(preview(r.text).replace(/^/gm, '   '));
      else lines.push(`   ${r.fileType ?? 'Binary data'}, ${r.byteLength} bytes`);
      return lines.join('\n');
    })
    .join('\n\n');
}

/** The best guess on its own, as text. For the Pipeline. */
export function magicBest(input: string): string {
  const { results } = magic(input);
  const best = results.find((r) => r.text !== null);
  if (!best) throw new ToolError('No known encoding turned this into readable text.');
  return best.text!;
}
