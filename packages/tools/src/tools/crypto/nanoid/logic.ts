import { ToolError } from '@/core/types';
import { bytesToBase64, bytesToBase64Url, bytesToHex, randomBytes } from '../_lib/bytes';

export type TokenKind = 'nanoid' | 'alphanumeric' | 'lowercase' | 'numeric' | 'custom' | 'hex' | 'base64' | 'base64url';

export interface TokenOptions {
  kind: TokenKind;
  /** Characters for nanoid-style kinds, bytes for hex/base64/base64url. */
  size: number;
  alphabet?: string;
  count: number;
}

export const MAX_SIZE = 4096;
export const MAX_COUNT = 1000;

const ALPHABETS: Partial<Record<TokenKind, string>> = {
  alphanumeric: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz0123456789',
  numeric: '0123456789',
};

export function alphabetFor(o: Pick<TokenOptions, 'kind' | 'alphabet'>): string | null {
  if (o.kind === 'custom') return Array.from(new Set(Array.from(o.alphabet ?? ''))).join('');
  return ALPHABETS[o.kind] ?? null;
}

export async function generateTokens(o: TokenOptions): Promise<{ tokens: string[]; entropyBits: number }> {
  const size = Math.floor(o.size);
  if (!(size >= 1) || size > MAX_SIZE) throw new ToolError(`Size must be between 1 and ${MAX_SIZE}.`);
  const count = Math.max(1, Math.min(MAX_COUNT, Math.floor(o.count)));
  const tokens: string[] = [];
  if (o.kind === 'hex' || o.kind === 'base64' || o.kind === 'base64url') {
    for (let i = 0; i < count; i++) {
      const b = randomBytes(size);
      tokens.push(o.kind === 'hex' ? bytesToHex(b) : o.kind === 'base64' ? bytesToBase64(b) : bytesToBase64Url(b));
    }
    return { tokens, entropyBits: size * 8 };
  }
  const nano = await import('nanoid');
  if (o.kind === 'nanoid') {
    for (let i = 0; i < count; i++) tokens.push(nano.nanoid(size));
    return { tokens, entropyBits: size * 6 };
  }
  const alphabet = alphabetFor(o)!;
  if (alphabet.length < 2) throw new ToolError('The alphabet needs at least 2 different characters.');
  if (alphabet.length > 255) throw new ToolError('The alphabet can have at most 255 different characters.');
  const gen = nano.customAlphabet(alphabet, size);
  for (let i = 0; i < count; i++) tokens.push(gen());
  return { tokens, entropyBits: size * Math.log2(alphabet.length) };
}
