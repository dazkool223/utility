import { ToolError } from '@/core/types';

export type UrlScope = 'component' | 'full' | 'form';

export function encodeUrl(input: string, scope: UrlScope): string {
  try {
    if (scope === 'full') return encodeURI(input);
    const enc = encodeURIComponent(input);
    return scope === 'form' ? enc.replace(/%20/g, '+') : enc;
  } catch {
    throw new ToolError('This text contains a broken Unicode character (a lone surrogate) that cannot be URL-encoded.');
  }
}

export function decodeUrl(input: string, scope: UrlScope): string {
  const text = scope === 'form' ? input.replace(/\+/g, ' ') : input;
  try {
    return scope === 'full' ? decodeURI(text) : decodeURIComponent(text);
  } catch {
    throw new ToolError('This is not valid URL encoding: a % sign is not followed by two hex digits, or the bytes are not valid UTF-8.');
  }
}
