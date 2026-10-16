import { describe, expect, it } from 'vitest';
import { formatXml } from './logic';

const o = { indent: '2', collapseContent: true } as const;

describe('formatXml', () => {
  it('indents nested elements', () => {
    expect(formatXml('<a><b>1</b><c><d/></c></a>', o)).toBe('<a>\n  <b>1</b>\n  <c>\n    <d/>\n  </c>\n</a>');
  });
  it('keeps the declaration, attributes and comments', () => {
    expect(formatXml('<?xml version="1.0"?><a x="1"><!-- c --><b/></a>', o)).toBe('<?xml version="1.0"?>\n<a x="1">\n  <!-- c -->\n  <b/>\n</a>');
  });
  it('supports tabs and 4 spaces', () => {
    expect(formatXml('<a><b/></a>', { ...o, indent: 'tab' })).toBe('<a>\n\t<b/>\n</a>');
    expect(formatXml('<a><b/></a>', { ...o, indent: '4' })).toBe('<a>\n    <b/>\n</a>');
  });
  it('can put text on its own line', () => {
    expect(formatXml('<a><b>1</b></a>', { ...o, collapseContent: false })).toContain('<b>\n');
  });
  it('re-formats already formatted input and keeps unicode', () => {
    const once = formatXml('<a>\n   <b>é✓</b>\n</a>', o);
    expect(formatXml(once, o)).toBe(once);
    expect(once).toContain('é✓');
  });
  it('rejects malformed XML with a position', () => {
    expect(() => formatXml('<a><b></a>', o)).toThrow(/line 1/);
  });
  it('handles large input', () => {
    expect(formatXml('<r>' + '<i>x</i>'.repeat(20_000) + '</r>', o).split('\n')).toHaveLength(20_002);
  });
});
