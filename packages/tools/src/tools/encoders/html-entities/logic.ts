import * as he from 'he';
import { ToolError } from '@/core/types';

export type EntityStyle = 'minimal' | 'named' | 'hex' | 'decimal';

export function encodeEntities(input: string, style: EntityStyle): string {
  switch (style) {
    case 'minimal':
      return he.escape(input);
    case 'named':
      return he.encode(input, { useNamedReferences: true });
    case 'decimal':
      return he.encode(input, { decimal: true });
    default:
      return he.encode(input);
  }
}

export function decodeEntities(input: string): string {
  try {
    return he.decode(input, { strict: false });
  } catch {
    throw new ToolError('Could not decode the HTML entities in this text.');
  }
}
