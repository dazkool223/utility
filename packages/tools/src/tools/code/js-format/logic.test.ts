import { describe, expect, it } from 'vitest';
import { DEFAULT_JS_OPTIONS, formatJs } from './logic';

describe('formatJs', () => {
  it('formats JavaScript', async () => {
    expect(await formatJs('const a={b:1,c:[1,2]};function f(x){return x+1}')).toBe("const a = { b: 1, c: [1, 2] };\nfunction f(x) {\n  return x + 1;\n}");
  });
  it('respects options', async () => {
    const out = await formatJs(`const s = "hi"\nlet y = 2`, { ...DEFAULT_JS_OPTIONS, semi: false, singleQuote: false, indent: '4' });
    expect(out).toBe('const s = "hi"\nlet y = 2');
    expect(await formatJs('if(a){b()}', { ...DEFAULT_JS_OPTIONS, indent: 'tab' })).toBe('if (a) {\n\tb();\n}');
    expect(await formatJs('f(1,2,3)', { ...DEFAULT_JS_OPTIONS, printWidth: 5 })).toContain('\n');
  });
  it('formats JSX and modern syntax', async () => {
    expect(await formatJs('const x=<div className="a">{y?.z ?? 1}</div>')).toContain('<div className="a">');
    expect(await formatJs('class A{#p=1;static s=()=>1}')).toContain('#p = 1;');
  });
  it('formats TypeScript', async () => {
    const out = await formatJs('interface A{a:string;b?:number}\nconst f=<T,>(x:T):T=>x;enum E{A,B}', { ...DEFAULT_JS_OPTIONS, language: 'typescript' });
    expect(out).toContain('interface A {\n  a: string;\n  b?: number;\n}');
    expect(out).toContain('enum E {');
  });
  it('keeps unicode', async () => {
    expect(await formatJs("const s='héllo 日本語 😀'")).toBe("const s = 'héllo 日本語 😀';");
  });
  it('returns empty output for empty input', async () => {
    expect(await formatJs('  \n')).toBe('');
  });
  it('handles large input', async () => {
    const big = Array.from({ length: 2000 }, (_, i) => `function f${i}(a,b){return a+b+${i}}`).join('\n');
    const out = await formatJs(big);
    expect(out.split('\n').length).toBe(6000);
  });
  it('reports syntax errors with a position', async () => {
    await expect(formatJs('const = ;')).rejects.toThrow(/Could not read this JavaScript.*line 1/);
    await expect(formatJs('let x: number = 1;')).rejects.toThrow('Could not read this JavaScript');
  });
});
