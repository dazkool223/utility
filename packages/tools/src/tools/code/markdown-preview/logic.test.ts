// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { markdownStats, renderedText, renderPreview } from './logic';

describe('renderPreview', () => {
  it('renders Markdown', () => {
    expect(renderPreview('# Hi\n\n*em*')).toBe('<h1>Hi</h1>\n<p><em>em</em></p>\n');
  });
  it('strips scripts, handlers, styles and forms', () => {
    const out = renderPreview('<script>alert(1)</script><a href="javascript:alert(1)" onclick="x()">a</a><style>a{}</style><form><input></form><div style="color:red">d</div>');
    expect(out).not.toMatch(/script|onclick|<style|<form|<input|style=|javascript:/);
  });
  it('replaces remote images with their alt text but keeps data images', () => {
    const out = renderPreview('![logo](https://example.com/a.png)\n\n![dot](data:image/gif;base64,R0lGODlhAQABAAAAACw=)');
    expect(out).not.toContain('example.com/a.png');
    expect(out).toContain('[image: logo (remote images are not loaded)]');
    expect(out).toContain('src="data:image/gif;base64');
  });
  it('removes remote media and srcset', () => {
    const out = renderPreview('<video src="https://e.com/v.mp4"></video><img srcset="https://e.com/a.png 2x" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">');
    expect(out).not.toContain('e.com');
  });
  it('opens links safely', () => {
    expect(renderPreview('[x](https://e.com)')).toContain('rel="noopener noreferrer" target="_blank"');
  });
  it('renders GFM tables and unicode', () => {
    expect(renderPreview('| é | 日本 |\n|---|---|\n| 1 | 2 |')).toContain('<th>é</th>');
  });
  it('returns empty output for empty input', () => {
    expect(renderPreview('')).toBe('');
  });
});

describe('helpers', () => {
  it('extracts plain text', () => {
    expect(renderedText('# Title\n\nSome **bold** text')).toBe('Title\nSome bold text');
  });
  it('counts', () => {
    expect(markdownStats('# A\n\ntwo words [l](u)\n## B')).toEqual({ words: 7, characters: 26, headings: 2, links: 1 });
    expect(markdownStats('')).toEqual({ words: 0, characters: 0, headings: 0, links: 0 });
  });
});
