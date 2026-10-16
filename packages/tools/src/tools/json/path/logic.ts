import { JSONPath } from 'jsonpath-plus';
import { ToolError } from '@/core/types';
import { parseJson } from '../format/logic';

export function queryJsonPath(input: string, expression: string): string {
  const json = parseJson(input);
  const expr = expression.trim();
  if (!expr) throw new ToolError('Enter a JSONPath expression such as $.store.book[*].title');
  let results: unknown[];
  try {
    results = JSONPath({ path: expr, json: json as object, wrap: true }) as unknown[];
  } catch (e) {
    throw new ToolError(`That JSONPath expression could not be evaluated: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!results.length) return 'No matches';
  return JSON.stringify(results, null, 2);
}

export function queryPaths(input: string, expression: string): string[] {
  const json = parseJson(input);
  try {
    return (JSONPath({ path: expression, json: json as object, resultType: 'path' }) as string[]) ?? [];
  } catch {
    return [];
  }
}
