import { describe, expect, it } from 'vitest';
import { minifyXml } from './logic';

describe('minifyXml', () => {
  it('removes whitespace between elements', () => {
    expect(minifyXml('<a>\n  <b>1</b>\n  <c/>\n</a>', false)).toBe('<a><b>1</b><c/></a>');
  });
  it('strips comments when asked', () => {
    expect(minifyXml('<a><!-- c --><b/></a>', true)).toBe('<a><b/></a>');
    expect(minifyXml('<a><!-- c --><b/></a>', false)).toBe('<a><!-- c --><b/></a>');
  });
  it('keeps the declaration, attributes and unicode', () => {
    expect(minifyXml('<?xml version="1.0"?>\n<a x="é">✓</a>', false)).toBe('<?xml version="1.0"?><a x="é">✓</a>');
  });
  it('rejects malformed XML', () => {
    expect(() => minifyXml('<a>', false)).toThrow(/Not well-formed/);
    expect(() => minifyXml('', false)).toThrow(/no XML/);
  });
  it('handles large input', () => {
    const big = '<r>\n' + '  <i>x</i>\n'.repeat(50_000) + '</r>';
    expect(minifyXml(big, false).length).toBeLessThan(big.length);
  });
});
