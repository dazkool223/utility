import { ToolError } from '@/core/types';
import { jsonrepair } from 'jsonrepair';

/** Fix common JSON mistakes: single quotes, trailing commas, comments, unquoted keys, truncated input. */
export function repairJson(input: string, indent: number): string {
  let fixed: string;
  try {
    fixed = jsonrepair(input);
  } catch (e) {
    throw new ToolError(`This could not be repaired: ${e instanceof Error ? e.message : String(e)}`);
  }
  return indent > 0 ? JSON.stringify(JSON.parse(fixed), null, indent) : fixed;
}
