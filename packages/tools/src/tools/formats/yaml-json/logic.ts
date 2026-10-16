import { parseAllDocuments, stringify, type YAMLError } from 'yaml';
import { ToolError } from '@/core/types';
import { parseJson } from '../../json/format/logic';

export function describeYamlError(e: YAMLError): string {
  const where = e.linePos?.[0];
  const reason = e.message.split('\n')[0]!.replace(/ at line \d+, column \d+:?$/, '');
  return where ? `line ${where.line}, column ${where.col}: ${reason}` : reason;
}

/** Parse YAML (one or many documents) into plain JS values. Throws a ToolError with line and column. */
export function parseYaml(input: string): unknown {
  const docs = parseAllDocuments(input, { uniqueKeys: true });
  const list = Array.isArray(docs) ? docs : [docs];
  const errors = list.flatMap((d) => d.errors);
  if (errors.length) throw new ToolError(`Invalid YAML at ${describeYamlError(errors[0]!)}`);
  const values = list.map((d) => d.toJS());
  return values.length === 0 ? null : values.length === 1 ? values[0] : values;
}

export function jsonToYaml(input: string, indent = 2): string {
  return stringify(parseJson(input), { indent, lineWidth: 0 }).trimEnd();
}

export function yamlToJson(input: string, indent = 2): string {
  const value = parseYaml(input);
  return JSON.stringify(value === undefined ? null : value, null, indent);
}
