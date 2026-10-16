import { describe, expect, it } from 'vitest';
import { DEFAULT_CSS_MINIFY, minifyCss } from './logic';

describe('minifyCss', () => {
  it('minifies', async () => {
    expect(await minifyCss('a {\n  color: #ff0000;\n  margin: 0px auto;\n}\n/* c */\nb { }')).toBe('a{color:red;margin:0 auto}');
  });
  it('merges rules when restructuring', async () => {
    const src = 'a{color:red}b{color:red}';
    expect(await minifyCss(src, { ...DEFAULT_CSS_MINIFY, restructure: true })).toBe('a,b{color:red}');
    expect(await minifyCss(src)).toBe('a{color:red}b{color:red}');
  });
  it('keeps licence comments only when asked', async () => {
    const src = '/*! lic */\na{color:red}';
    expect(await minifyCss(src)).toBe('/*! lic */\na{color:red}');
    expect(await minifyCss(src, { ...DEFAULT_CSS_MINIFY, keepBangComments: false })).toBe('a{color:red}');
  });
  it('handles media queries, variables and unicode', async () => {
    const out = await minifyCss('@media (max-width: 600px) { :root { --a: 1px } a::before { content: "é日本" } }');
    expect(out).toContain('@media (max-width:600px)');
    expect(out).toContain('"é日本"');
    expect(out).toContain('--a:1px');
  });
  it('returns empty output for empty input', async () => {
    expect(await minifyCss(' ')).toBe('');
  });
  it('reports broken CSS', async () => {
    await expect(minifyCss('a { color: red; ')).rejects.toThrow('Could not read this CSS');
    await expect(minifyCss('a { color: "red; }')).rejects.toThrow('never closed');
    await expect(minifyCss('a { color red }')).rejects.toThrow('Could not read this CSS');
    await expect(minifyCss('a{} }')).rejects.toThrow('unexpected }');
  });
});
