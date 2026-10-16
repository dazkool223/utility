import { isScalar, parseAllDocuments, visit } from 'yaml';
import { ToolError } from '@/core/types';
import { describeYamlError } from '../yaml-json/logic';

export interface YamlFormatOptions {
  indent: 2 | 4;
  sortKeys: boolean;
}

/** Re-indent and tidy YAML while keeping comments. */
export function formatYaml(input: string, { indent, sortKeys }: YamlFormatOptions): string {
  const docs = parseAllDocuments(input, { uniqueKeys: true });
  const list = Array.isArray(docs) ? docs : [docs];
  const err = list.flatMap((d) => d.errors)[0];
  if (err) throw new ToolError(`Invalid YAML at ${describeYamlError(err)}`);
  return list
    .map((d) => {
      if (sortKeys) {
        visit(d, {
          Map(_, map) {
            const key = (p: { key: unknown }) => String(isScalar(p.key) ? p.key.value : p.key);
            map.items.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
          },
        });
      }
      return d.toString({ indent, lineWidth: 0 }).trimEnd();
    })
    .map((s, i) => (i > 0 ? s.replace(/^---\n?/, '') : s))
    .join('\n---\n');
}
