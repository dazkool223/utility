import { describe, expect, it } from 'vitest';
import { DEFAULT_JS_MINIFY, minifyJs } from './logic';

describe('minifyJs', () => {
  it('minifies and mangles', async () => {
    const out = await minifyJs('function add(first, second) {\n  // sum\n  return first + second;\n}\nconsole.log(add(1, 2));');
    expect(out).toMatch(/^function add\((\w),(\w)\)\{return \1\+\2\}console\.log\(add\(1,2\)\);$/);
  });
  it('can skip mangling and compression', async () => {
    const out = await minifyJs('function add(first, second) { return first + second; }', { ...DEFAULT_JS_MINIFY, mangle: false, compress: false });
    expect(out).toBe('function add(first,second){return first+second}');
  });
  it('keeps license comments when asked', async () => {
    const src = '/*! @license MIT */\nvar a = 1;\nconsole.log(a);';
    expect(await minifyJs(src, { ...DEFAULT_JS_MINIFY, keepComments: 'license' })).toContain('@license MIT');
    expect(await minifyJs(src)).not.toContain('license');
  });
  it('supports modules', async () => {
    expect(await minifyJs('export const x = 1;', { ...DEFAULT_JS_MINIFY, module: true })).toContain('export');
    expect(await minifyJs('export function f(longName){return longName}', { ...DEFAULT_JS_MINIFY, module: true })).toMatch(/^export function f\((\w)\)\{return \1\}$/);
  });
  it('keeps unicode strings', async () => {
    expect(await minifyJs('console.log("héllo 日本語 😀")')).toContain('héllo 日本語 😀');
  });
  it('returns empty output for empty input', async () => {
    expect(await minifyJs('')).toBe('');
  });
  it('reports syntax errors with a position', async () => {
    await expect(minifyJs('let = ;')).rejects.toThrow(/Could not read this JavaScript.*line 1/);
  });
});
