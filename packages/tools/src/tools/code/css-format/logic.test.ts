import { describe, expect, it } from 'vitest';
import { DEFAULT_CSS_OPTIONS, formatCss } from './logic';

describe('formatCss', () => {
  it('formats CSS', async () => {
    expect(await formatCss('a{color:red;margin:0 auto}b>c{x:y}')).toBe('a {\n  color: red;\n  margin: 0 auto;\n}\nb > c {\n  x: y;\n}');
  });
  it('respects indent and quotes', async () => {
    expect(await formatCss("a{content:'x'}", { ...DEFAULT_CSS_OPTIONS, indent: 'tab' })).toBe('a {\n\tcontent: "x";\n}');
    expect(await formatCss('a{content:"x"}', { ...DEFAULT_CSS_OPTIONS, singleQuote: true, indent: '4' })).toBe("a {\n    content: 'x';\n}");
  });
  it('formats media queries, comments and custom properties', async () => {
    const out = await formatCss('/* c */@media (max-width:600px){:root{--a:1px}.x{margin:var(--a)}}');
    expect(out).toContain('/* c */');
    expect(out).toContain('@media (max-width: 600px) {');
    expect(out).toContain('--a: 1px;');
  });
  it('formats SCSS and Less', async () => {
    expect(await formatCss('.a{.b{c:d}}', { ...DEFAULT_CSS_OPTIONS, language: 'scss' })).toBe('.a {\n  .b {\n    c: d;\n  }\n}');
    expect(await formatCss('@c:red;.a{color:@c}', { ...DEFAULT_CSS_OPTIONS, language: 'less' })).toContain('color: @c;');
  });
  it('keeps unicode', async () => {
    expect(await formatCss('a::before{content:"é日本"}')).toContain('"é日本"');
  });
  it('returns empty output for empty input', async () => {
    expect(await formatCss('')).toBe('');
  });
  it('reports broken CSS', async () => {
    await expect(formatCss('a{color:red')).rejects.toThrow('Could not read this CSS');
  });
});
