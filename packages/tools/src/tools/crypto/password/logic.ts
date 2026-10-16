import { ToolError } from '@/core/types';
import { randomInt } from '../_lib/bytes';

export const LOWER = 'abcdefghijklmnopqrstuvwxyz';
export const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const DIGITS = '0123456789';
export const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>/?';
export const AMBIGUOUS = 'Il1O0o|`\'"';

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  /** Extra characters to leave out. */
  exclude?: string;
  /** Replace the default symbol set. */
  customSymbols?: string;
  count: number;
}

export const MAX_LENGTH = 512;
export const MAX_COUNT = 1000;

export interface PasswordBatch {
  passwords: string[];
  /** Pool size used for each draw (bits = length * log2(pool)). */
  poolSize: number;
  entropyBits: number;
}

function unique(s: string): string[] {
  return Array.from(new Set(Array.from(s)));
}

export function buildClasses(o: PasswordOptions): string[][] {
  const drop = new Set(Array.from((o.excludeAmbiguous ? AMBIGUOUS : '') + (o.exclude ?? '')));
  const classes: string[][] = [];
  if (o.lower) classes.push(unique(LOWER));
  if (o.upper) classes.push(unique(UPPER));
  if (o.digits) classes.push(unique(DIGITS));
  if (o.symbols) classes.push(unique(o.customSymbols?.length ? o.customSymbols : SYMBOLS));
  return classes.map((c) => c.filter((ch) => !drop.has(ch))).filter((c) => c.length > 0);
}

/** Fisher-Yates shuffle driven by the crypto RNG. */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function generatePasswords(o: PasswordOptions): PasswordBatch {
  const length = Math.floor(o.length);
  if (!(length >= 1) || length > MAX_LENGTH) throw new ToolError(`Length must be between 1 and ${MAX_LENGTH}.`);
  const classes = buildClasses(o);
  if (!classes.length) throw new ToolError('Pick at least one character type (and leave some characters allowed).');
  if (length < classes.length) throw new ToolError(`A ${length}-character password cannot contain all ${classes.length} chosen character types. Increase the length.`);
  const pool = Array.from(new Set(classes.flat()));
  const count = Math.max(1, Math.min(MAX_COUNT, Math.floor(o.count)));
  const passwords: string[] = [];
  for (let n = 0; n < count; n++) {
    // One guaranteed character from each class, the rest from the whole pool, then shuffle.
    const chars: string[] = classes.map((c) => c[randomInt(c.length)]!);
    while (chars.length < length) chars.push(pool[randomInt(pool.length)]!);
    passwords.push(shuffle(chars).join(''));
  }
  return { passwords, poolSize: pool.length, entropyBits: length * Math.log2(pool.length) };
}

export interface PassphraseOptions {
  words: number;
  separator: string;
  capitalize: boolean;
  addNumber: boolean;
  count: number;
}

export function generatePassphrases(o: PassphraseOptions, wordlist: readonly string[]): PasswordBatch {
  const words = Math.floor(o.words);
  if (!(words >= 1) || words > 50) throw new ToolError('Word count must be between 1 and 50.');
  if (wordlist.length < 2) throw new ToolError('The word list is not available.');
  const count = Math.max(1, Math.min(MAX_COUNT, Math.floor(o.count)));
  const out: string[] = [];
  for (let n = 0; n < count; n++) {
    const picked: string[] = [];
    for (let i = 0; i < words; i++) {
      const w = wordlist[randomInt(wordlist.length)]!;
      picked.push(o.capitalize ? w[0]!.toUpperCase() + w.slice(1) : w);
    }
    let p = picked.join(o.separator);
    if (o.addNumber) p += o.separator + randomInt(100);
    out.push(p);
  }
  const bits = words * Math.log2(wordlist.length) + (o.addNumber ? Math.log2(100) : 0);
  return { passwords: out, poolSize: wordlist.length, entropyBits: bits };
}

export function entropyLabel(bits: number): string {
  if (bits < 40) return 'weak';
  if (bits < 60) return 'fair';
  if (bits < 80) return 'good';
  if (bits < 100) return 'strong';
  return 'very strong';
}

export async function loadWordlist(): Promise<readonly string[]> {
  const m = await import('@zxcvbn-ts/language-common');
  return m.dictionary['diceware-common'];
}

/** Entropy of the current password options without generating anything; 0 when the options are unusable. */
export function passwordEntropy(o: Omit<PasswordOptions, 'count'>): number {
  const pool = new Set(buildClasses({ ...o, count: 1 }).flat()).size;
  return pool > 1 ? Math.floor(o.length) * Math.log2(pool) : 0;
}
