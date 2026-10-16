import { XMLValidator } from 'fast-xml-parser';
import { ToolError } from '@/core/types';

/** Throws a ToolError naming the line and column of the first well-formedness problem. */
export function assertWellFormed(xml: string): void {
  if (!xml.trim()) throw new ToolError('There is no XML to check.');
  const r = XMLValidator.validate(xml, { allowBooleanAttributes: false });
  if (r !== true) {
    const { msg, line, col } = r.err;
    throw new ToolError(`Not well-formed XML at line ${line}${col ? `, column ${col}` : ''}: ${msg}`);
  }
}

export function validateXml(xml: string): string {
  assertWellFormed(xml);
  const stripped = xml.replace(/<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>/g, '');
  const root = /<([A-Za-z_][\w.:-]*)[\s>/]/.exec(stripped);
  const elements = (stripped.match(/<[A-Za-z_][\w.:-]*[\s>/]/g) ?? []).length;
  return `Well-formed XML\nRoot element: ${root?.[1] ?? '(none)'}\nElements: ${elements}\nSize: ${new TextEncoder().encode(xml).length} bytes`;
}
