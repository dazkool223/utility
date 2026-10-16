import { describe, expect, it } from 'vitest';
import { queryJsonPath, queryPaths } from './logic';

const doc = JSON.stringify({ store: { book: [{ title: 'A', price: 8 }, { title: 'B', price: 12 }], bike: { color: 'red' } } });

describe('queryJsonPath', () => {
  it('selects by wildcard', () => {
    expect(JSON.parse(queryJsonPath(doc, '$.store.book[*].title'))).toEqual(['A', 'B']);
  });
  it('supports recursive descent', () => {
    expect(JSON.parse(queryJsonPath(doc, '$..price'))).toEqual([8, 12]);
  });
  it('supports filters', () => {
    expect(JSON.parse(queryJsonPath(doc, '$.store.book[?(@.price > 10)].title'))).toEqual(['B']);
  });
  it('supports slices and unicode keys', () => {
    expect(JSON.parse(queryJsonPath('{"é":[1,2,3]}', '$.é[0:2]'))).toEqual([1, 2]);
  });
  it('says when nothing matches', () => {
    expect(queryJsonPath(doc, '$.nothing')).toBe('No matches');
  });
  it('returns normalised paths', () => {
    expect(queryPaths(doc, '$..color')).toEqual(["$['store']['bike']['color']"]);
  });
  it('rejects empty expressions and invalid JSON', () => {
    expect(() => queryJsonPath(doc, ' ')).toThrow(/Enter a JSONPath/);
    expect(() => queryJsonPath('{', '$')).toThrow(/Invalid JSON/);
  });
  it('handles large documents', () => {
    const big = JSON.stringify({ a: Array.from({ length: 50_000 }, (_, i) => ({ i })) });
    expect(JSON.parse(queryJsonPath(big, '$.a[*].i'))).toHaveLength(50_000);
  });
});
