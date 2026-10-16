import {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  kebabCase,
  noCase,
  pascalCase,
  pascalSnakeCase,
  pathCase,
  sentenceCase,
  snakeCase,
  trainCase,
} from 'change-case';

export type CaseId =
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'dot'
  | 'path'
  | 'train'
  | 'pascal-snake'
  | 'capital'
  | 'sentence'
  | 'title'
  | 'upper'
  | 'lower'
  | 'swap'
  | 'no';

const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'via']);

function titleCase(s: string): string {
  const words = s.split(/(\s+)/);
  let first = true;
  return words
    .map((w) => {
      if (/^\s*$/.test(w)) return w;
      const lower = w.toLowerCase();
      const out = !first && SMALL.has(lower) ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
      first = false;
      return out;
    })
    .join('');
}

function swapCase(s: string): string {
  return Array.from(s, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('');
}

export const CASES: ReadonlyArray<{ id: CaseId; label: string; fn: (s: string) => string }> = [
  { id: 'camel', label: 'camelCase', fn: (s) => camelCase(s) },
  { id: 'pascal', label: 'PascalCase', fn: (s) => pascalCase(s) },
  { id: 'snake', label: 'snake_case', fn: (s) => snakeCase(s) },
  { id: 'kebab', label: 'kebab-case', fn: (s) => kebabCase(s) },
  { id: 'constant', label: 'CONSTANT_CASE', fn: (s) => constantCase(s) },
  { id: 'dot', label: 'dot.case', fn: (s) => dotCase(s) },
  { id: 'path', label: 'path/case', fn: (s) => pathCase(s) },
  { id: 'train', label: 'Train-Case', fn: (s) => trainCase(s) },
  { id: 'pascal-snake', label: 'Pascal_Snake_Case', fn: (s) => pascalSnakeCase(s) },
  { id: 'capital', label: 'Capital Case', fn: (s) => capitalCase(s) },
  { id: 'sentence', label: 'Sentence case', fn: (s) => sentenceCase(s) },
  { id: 'title', label: 'Title Case', fn: titleCase },
  { id: 'upper', label: 'UPPER CASE', fn: (s) => s.toUpperCase() },
  { id: 'lower', label: 'lower case', fn: (s) => s.toLowerCase() },
  { id: 'swap', label: 'sWAP cASE', fn: swapCase },
  { id: 'no', label: 'no case', fn: (s) => noCase(s) },
];

/** Convert each line separately so multi-line lists keep their shape. */
export function convertCase(input: string, id: CaseId): string {
  const c = CASES.find((x) => x.id === id)!;
  return input
    .split('\n')
    .map((line) => (line.trim() ? c.fn(line) : line))
    .join('\n');
}

/** Every case for each non-empty line, one block per line. */
export function allCases(input: string): string {
  return input
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => CASES.map((c) => `${c.label.padEnd(18)} ${c.fn(line)}`).join('\n'))
    .join('\n\n');
}
