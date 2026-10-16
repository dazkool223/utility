// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { DEFAULT_MD_HTML, mdToHtml } from './logic';

describe('mdToHtml', () => {
  it('converts basic Markdown', () => {
    expect(mdToHtml('# Title\n\nSome **bold** and `code`.')).toBe('<h1>Title</h1>\n<p>Some <strong>bold</strong> and <code>code</code>.</p>');
  });
  it('converts lists, links and code blocks', () => {
    const out = mdToHtml('- a\n- b\n\n[x](https://e.com)\n\n```js\nlet a = 1 < 2;\n```');
    expect(out).toContain('<ul>\n<li>a</li>\n<li>b</li>\n</ul>');
    expect(out).toContain('<a href="https://e.com">x</a>');
    expect(out).toContain('<pre><code class="language-js">let a = 1 &lt; 2;');
  });
  it('supports GFM tables and task lists, and can turn GFM off', () => {
    const md = '| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done';
    const on = mdToHtml(md);
    expect(on).toContain('<table>');
    expect(on).toContain('type="checkbox"');
    expect(mdToHtml(md, { ...DEFAULT_MD_HTML, gfm: false })).not.toContain('<table>');
  });
  it('honours the line break option', () => {
    expect(mdToHtml('a\nb')).not.toContain('<br>');
    expect(mdToHtml('a\nb', { ...DEFAULT_MD_HTML, breaks: true })).toContain('<br>');
  });
  it('keeps unicode', () => {
    expect(mdToHtml('héllo 日本語 😀')).toBe('<p>héllo 日本語 😀</p>');
  });
  it('passes raw HTML through unless sanitising', () => {
    const md = 'hi <img src=x onerror=alert(1)> <script>alert(1)</script>';
    expect(mdToHtml(md)).toContain('<script>');
    const safe = mdToHtml(md, { ...DEFAULT_MD_HTML, sanitize: true });
    expect(safe).not.toContain('script');
    expect(safe).not.toContain('onerror');
  });
  it('returns empty output for empty input', () => {
    expect(mdToHtml(' \n')).toBe('');
  });
  it('handles large input', () => {
    const md = Array.from({ length: 5000 }, (_, i) => `## Heading ${i}\n\nparagraph ${i}`).join('\n\n');
    expect(mdToHtml(md).split('<h2').length).toBe(5001);
  });
});
