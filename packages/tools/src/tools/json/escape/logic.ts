import { ToolError } from '@/core/types';

/** Text -> JSON string literal (the form you paste into code or another JSON document). */
export function stringifyText(input: string, ascii: boolean): string {
  const s = JSON.stringify(input);
  return ascii ? s.replace(/[\u007f-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')) : s;
}

/** JSON string literal -> text. Accepts the surrounding quotes or not. */
export function unstringifyText(input: string): string {
  const t = input.trim();
  const quoted = t.length >= 2 && t.startsWith('"') && t.endsWith('"') ? t : `"${t.replace(/(?<!\\)"/g, '\\"')}"`;
  try {
    const v: unknown = JSON.parse(quoted);
    if (typeof v !== 'string') throw new Error('not a string');
    return v;
  } catch {
    throw new ToolError('Not a valid JSON string: check for a lone backslash or an invalid escape such as \\q.');
  }
}
