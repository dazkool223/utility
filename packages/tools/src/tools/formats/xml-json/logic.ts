import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { ToolError } from '@/core/types';
import { parseJson } from '../../json/format/logic';
import { assertWellFormed } from '../xml-validate/logic';

export interface XmlToJsonOptions {
  /** Keep attributes (prefixed with @_). */
  attributes: boolean;
  /** Turn numeric and boolean text into numbers and booleans. */
  types: boolean;
}

export function xmlToJson(input: string, { attributes, types }: XmlToJsonOptions): string {
  assertWellFormed(input);
  const parser = new XMLParser({
    ignoreAttributes: !attributes,
    attributeNamePrefix: '@_',
    parseTagValue: types,
    parseAttributeValue: types,
    ignoreDeclaration: true,
    trimValues: true,
  });
  return JSON.stringify(parser.parse(input), null, 2);
}

export function jsonToXml(input: string, indent = 2): string {
  const value = parseJson(input);
  if (value === null || typeof value !== 'object') throw new ToolError('XML needs a JSON object or array at the top level, not a single value.');
  let root: unknown = value;
  if (Array.isArray(value)) root = { root: { item: value } };
  else if (Object.keys(value).length !== 1) root = { root: value };
  const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_', format: indent > 0, indentBy: ' '.repeat(indent), suppressEmptyNode: true });
  return String(builder.build(root)).trim();
}
