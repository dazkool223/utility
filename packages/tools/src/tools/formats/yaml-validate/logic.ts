import { parseAllDocuments } from 'yaml';
import { ToolError } from '@/core/types';
import { describeYamlError } from '../yaml-json/logic';

/** Lint YAML: syntax errors, duplicate keys, bad indentation, unresolved aliases, with line and column. */
export function validateYaml(input: string): string {
  const docs = parseAllDocuments(input, { uniqueKeys: true });
  const list = Array.isArray(docs) ? docs : [docs];
  const errors = list.flatMap((d) => d.errors);
  if (errors.length) {
    throw new ToolError(`${errors.length} problem${errors.length > 1 ? 's' : ''} found:\n` + errors.map((e) => `- ${describeYamlError(e)}`).join('\n'));
  }
  const warnings = list.flatMap((d) => d.warnings);
  const first = list[0]?.toJS();
  const shape = Array.isArray(first) ? `sequence with ${first.length} items` : first && typeof first === 'object' ? `mapping with ${Object.keys(first).length} keys` : first === null || first === undefined ? 'empty' : typeof first;
  const lines = ['Valid YAML', `Documents: ${list.length}`, `Top level: ${shape}`];
  if (warnings.length) lines.push('', 'Warnings:', ...warnings.map((w) => `- ${describeYamlError(w)}`));
  return lines.join('\n');
}
