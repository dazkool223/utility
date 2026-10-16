import { describe, expect, it } from 'vitest';
import { validateXml } from './logic';

describe('validateXml', () => {
  it('accepts well-formed XML and reports the root', () => {
    const r = validateXml('<?xml version="1.0"?>\n<!-- c -->\n<root a="1"><x/><y>t</y></root>');
    expect(r).toContain('Well-formed XML');
    expect(r).toContain('Root element: root');
    expect(r).toContain('Elements: 3');
  });
  it('reports mismatched tags with a position', () => {
    expect(() => validateXml('<a>\n<b>\n</a>')).toThrow(/line 3.*closing tag/i);
  });
  it('reports attributes without values', () => {
    expect(() => validateXml('<a x=1/>')).toThrow(/Not well-formed XML at line 1/);
  });
  it('rejects empty input and plain text', () => {
    expect(() => validateXml('')).toThrow(/no XML/);
    expect(() => validateXml('hello')).toThrow(/Not well-formed/);
  });
  it('handles unicode and large input', () => {
    expect(validateXml('<r>é✓</r>')).toContain('Well-formed');
    const big = '<r>' + '<i>x</i>'.repeat(100_000) + '</r>';
    expect(validateXml(big)).toContain('Elements: 100001');
  });
});
