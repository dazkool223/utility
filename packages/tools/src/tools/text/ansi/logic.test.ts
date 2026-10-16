import { describe, expect, it } from 'vitest';
import { ansiToHtml, stripAnsi } from './logic';

const ESC = '\u001b';

describe('stripAnsi', () => {
  it('removes colour codes', () => {
    expect(stripAnsi(`${ESC}[31mred${ESC}[0m and ${ESC}[1;32mbold green${ESC}[m`)).toBe('red and bold green');
  });
  it('removes cursor movement and erase sequences', () => {
    expect(stripAnsi(`a${ESC}[2K${ESC}[1Gb${ESC}[?25lc`)).toBe('abc');
  });
  it('removes OSC titles and hyperlinks', () => {
    expect(stripAnsi(`${ESC}]0;title\u0007text`)).toBe('text');
    expect(stripAnsi(`${ESC}]8;;https://x.com${ESC}\\link${ESC}]8;;${ESC}\\`)).toBe('link');
  });
  it('can remove bare codes whose ESC byte was lost', () => {
    expect(stripAnsi('[0;32mok[0m', true)).toBe('ok');
    expect(stripAnsi('[0;32mok[0m', false)).toBe('[0;32mok[0m');
    expect(stripAnsi('list[1] stays', true)).toBe('list[1] stays');
  });
  it('keeps unicode, newlines and plain text', () => {
    expect(stripAnsi('é✓\nplain')).toBe('é✓\nplain');
    expect(stripAnsi('')).toBe('');
  });
  it('handles large input', () => {
    const big = `${ESC}[32mline${ESC}[0m\n`.repeat(100_000);
    expect(stripAnsi(big)).toBe('line\n'.repeat(100_000));
  });
});

describe('ansiToHtml', () => {
  it('converts colours to inline styles', () => {
    const html = ansiToHtml(`${ESC}[31mred${ESC}[0m plain`, false);
    expect(html).toContain('<span style="color:rgb(187,0,0)">red</span>');
    expect(html).toContain('plain');
  });
  it('converts bold and underline', () => {
    expect(ansiToHtml(`${ESC}[1mB${ESC}[0m`, false)).toContain('font-weight:bold');
    expect(ansiToHtml(`${ESC}[4mU${ESC}[0m`, false)).toContain('text-decoration:underline');
  });
  it('escapes HTML in the text', () => {
    const html = ansiToHtml('<script>alert(1)</script> & more', false);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
  });
  it('can wrap the result in a pre element', () => {
    expect(ansiToHtml('x', true).startsWith('<pre')).toBe(true);
    expect(ansiToHtml('x', true).endsWith('</pre>')).toBe(true);
  });
  it('handles 256-colour and truecolour codes', () => {
    expect(ansiToHtml(`${ESC}[38;5;196mhot${ESC}[0m`, false)).toContain('color:rgb(');
    expect(ansiToHtml(`${ESC}[38;2;1;2;3mtc${ESC}[0m`, false)).toContain('color:rgb(1,2,3)');
  });
  it('handles empty input', () => {
    expect(ansiToHtml('', false)).toBe('');
  });
});
