import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { buildPrintDocument, DEFAULT_PRINT_OPTIONS, documentTitle, escapeHtml, fileNameFor, markdownToHtml, printCss, renderBody, wordCount } from './logic';
import { createSanitiser } from './sanitise';

const win = new JSDOM('').window as unknown as Window & typeof globalThis;
const sanitise = createSanitiser(win);

describe('markdownToHtml', () => {
  it('renders headings, emphasis, lists, tables and code', () => {
    const html = markdownToHtml('# Title\n\nSome **bold** and `code`.\n\n- a\n- b\n\n| x | y |\n|---|---|\n| 1 | 2 |\n\n```js\nlet a = 1;\n```\n');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<li>a</li>');
    expect(html).toContain('<table>');
    expect(html).toContain('<pre><code class="language-js">');
  });

  it('keeps unicode', () => {
    expect(markdownToHtml('# Zoë 世界 🙂')).toContain('Zoë 世界 🙂');
  });
});

describe('sanitiser', () => {
  it('removes scripts, event handlers, forms and external stylesheets', () => {
    const out = sanitise('<h1 onclick="x()">Hi</h1><script>alert(1)</script><link rel="stylesheet" href="https://evil.test/a.css"><form action="https://evil.test"><input></form><a href="javascript:alert(1)">bad</a>');
    expect(out).toContain('<h1>Hi</h1>');
    expect(out).not.toMatch(/script|onclick|<link|<form|<input|javascript:/i);
  });

  it('replaces remote images with a visible note and keeps embedded ones', () => {
    const out = sanitise('<p><img src="https://example.test/a.png" alt="Logo"><img src="data:image/png;base64,iVBORw0KGgo=" alt="Pixel"></p>');
    expect(out).toContain('[image not loaded: Logo]');
    expect(out).not.toContain('example.test/a.png');
    expect(out).toContain('data:image/png;base64');
  });

  it('keeps style blocks so pasted HTML keeps its look', () => {
    expect(sanitise('<style>p{color:red}</style><p>x</p>')).toContain('<style>p{color:red}</style>');
  });
});

describe('renderBody', () => {
  it('returns an empty body for blank input', () => {
    expect(renderBody('   \n', 'markdown', sanitise)).toBe('');
  });
  it('sanitises markdown that contains raw HTML', () => {
    const body = renderBody('# T\n\n<script>alert(1)</script>\n\n<b onmouseover="x()">hi</b>', 'markdown', sanitise);
    expect(body).not.toMatch(/script|onmouseover/i);
    expect(body).toContain('<b>hi</b>');
  });
  it('passes html through the sanitiser', () => {
    expect(renderBody('<p>ok</p><iframe src="https://x.test"></iframe>', 'html', sanitise)).toBe('<p>ok</p>');
  });
});

describe('print document', () => {
  it('sets page size, orientation and margin in @page', () => {
    const css = printCss({ ...DEFAULT_PRINT_OPTIONS, pageSize: 'letter', orientation: 'landscape', marginMm: 10 });
    expect(css).toContain('@page { size: letter landscape; margin: 10mm; }');
  });
  it('clamps absurd options', () => {
    const css = printCss({ ...DEFAULT_PRINT_OPTIONS, marginMm: 500, fontPt: 1 });
    expect(css).toContain('margin: 60mm');
    expect(css).toContain('font-size: 6pt');
  });
  it('adds page breaks before h1 only when asked', () => {
    expect(printCss(DEFAULT_PRINT_OPTIONS)).not.toContain('break-before: page');
    expect(printCss({ ...DEFAULT_PRINT_OPTIONS, breakBeforeH1: true })).toContain('break-before: page');
  });
  it('builds a full document with an escaped title', () => {
    const doc = buildPrintDocument('<p>x</p>', 'A <b> & "c"');
    expect(doc.startsWith('<!doctype html>')).toBe(true);
    expect(doc).toContain('<title>A &lt;b&gt; &amp; &quot;c&quot;</title>');
    expect(doc).toContain('<p>x</p>');
  });
});

describe('titles and counts', () => {
  it('uses the first h1, then any heading, then the fallback', () => {
    expect(documentTitle('<h2>Sub</h2><h1>Main &amp; more</h1>')).toBe('Main & more');
    expect(documentTitle('<h2>Only <em>sub</em></h2>')).toBe('Only sub');
    expect(documentTitle('<p>none</p>')).toBe('Document');
    expect(documentTitle('<h1></h1>', 'Untitled')).toBe('Untitled');
  });
  it('counts words and ignores style blocks', () => {
    expect(wordCount('<style>p{color:red}</style><p>one two  three</p>')).toBe(3);
    expect(wordCount('')).toBe(0);
  });
  it('makes safe file names', () => {
    expect(fileNameFor('a/b:c*?')).toBe('a b c');
    expect(fileNameFor('///')).toBe('document');
    expect(escapeHtml('<&>')).toBe('&lt;&amp;&gt;');
  });
});
