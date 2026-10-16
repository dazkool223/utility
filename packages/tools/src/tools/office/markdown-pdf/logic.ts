import { marked } from 'marked';
import { ToolError } from '@/core/types';

export type PageSize = 'a4' | 'a3' | 'a5' | 'letter' | 'legal';
export type Orientation = 'portrait' | 'landscape';
export type FontFamily = 'serif' | 'sans' | 'mono';
export type SourceKind = 'markdown' | 'html';

export interface PrintOptions {
  pageSize: PageSize;
  orientation: Orientation;
  /** Page margin in millimetres. */
  marginMm: number;
  /** Body font size in points. */
  fontPt: number;
  font: FontFamily;
  /** Start every top-level heading (h1) on a new page, except the first. */
  breakBeforeH1: boolean;
}

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  pageSize: 'a4',
  orientation: 'portrait',
  marginMm: 18,
  fontPt: 11,
  font: 'sans',
  breakBeforeH1: false,
};

/** Page width in millimetres (portrait), used to size the preview. */
export const PAGE_WIDTH_MM: Record<PageSize, number> = { a4: 210, a3: 297, a5: 148, letter: 215.9, legal: 215.9 };
export const PAGE_HEIGHT_MM: Record<PageSize, number> = { a4: 297, a3: 420, a5: 210, letter: 279.4, legal: 355.6 };

const CSS_PAGE_SIZE: Record<PageSize, string> = { a4: 'A4', a3: 'A3', a5: 'A5', letter: 'letter', legal: 'legal' };

const FONT_STACK: Record<FontFamily, string> = {
  serif: "Georgia, 'Times New Roman', Times, serif",
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
};

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Renders Markdown (GitHub flavour) to an HTML string. The result is NOT sanitised; run it through the sanitiser. */
export function markdownToHtml(markdown: string): string {
  const html = marked.parse(markdown, { gfm: true, breaks: false, async: false });
  if (typeof html !== 'string') throw new ToolError('The Markdown could not be rendered.');
  return html;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

/** The document title: the first <h1>, else the first heading, else `fallback`. */
export function documentTitle(bodyHtml: string, fallback = 'Document'): string {
  const heading = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(bodyHtml) ?? /<h[2-6]\b[^>]*>([\s\S]*?)<\/h[2-6]>/i.exec(bodyHtml);
  const text = heading ? stripTags(heading[1]!) : '';
  return text || fallback;
}

export function wordCount(bodyHtml: string): number {
  const text = stripTags(bodyHtml.replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, ''));
  return text ? text.split(/\s+/).length : 0;
}

export function printCss(o: PrintOptions): string {
  const margin = Math.min(Math.max(Math.round(o.marginMm * 10) / 10, 0), 60);
  const font = Math.min(Math.max(o.fontPt, 6), 36);
  return `
@page { size: ${CSS_PAGE_SIZE[o.pageSize]} ${o.orientation}; margin: ${margin}mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: ${FONT_STACK[o.font]}; font-size: ${font}pt; line-height: 1.5; color: #111; background: #fff; overflow-wrap: anywhere; }
h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.4em 0 0.5em; break-after: avoid; page-break-after: avoid; }
h1 { font-size: 2em; border-bottom: 1px solid #ccc; padding-bottom: 0.2em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #e3e3e3; padding-bottom: 0.15em; }
h3 { font-size: 1.25em; }
body > :first-child { margin-top: 0; }
p, ul, ol, blockquote, pre, table { margin: 0 0 1em; }
ul, ol { padding-left: 1.6em; }
li > p { margin: 0.25em 0; }
a { color: #0b57d0; text-decoration: underline; }
code, kbd, samp { font-family: ${FONT_STACK.mono}; font-size: 0.9em; background: #f2f2f2; padding: 0.1em 0.3em; border-radius: 3px; }
pre { background: #f6f6f6; border: 1px solid #ddd; border-radius: 4px; padding: 0.7em 0.9em; white-space: pre-wrap; break-inside: avoid; page-break-inside: avoid; }
pre code { background: none; padding: 0; font-size: 0.88em; }
blockquote { border-left: 4px solid #ccc; padding: 0.1em 1em; color: #444; break-inside: avoid; }
table { border-collapse: collapse; width: 100%; font-size: 0.95em; }
th, td { border: 1px solid #bbb; padding: 0.35em 0.6em; text-align: left; vertical-align: top; }
th { background: #f0f0f0; }
tr { break-inside: avoid; page-break-inside: avoid; }
img, svg, video { max-width: 100%; height: auto; break-inside: avoid; }
hr { border: 0; border-top: 1px solid #ccc; margin: 1.5em 0; }
.blocked-image { display: inline-block; border: 1px dashed #999; padding: 0.1em 0.5em; color: #666; font-size: 0.9em; }
${o.breakBeforeH1 ? 'h1:not(:first-of-type) { break-before: page; page-break-before: always; }' : ''}
`.trim();
}

/** A complete, self-contained HTML document ready to print or save. `bodyHtml` must already be sanitised. */
export function buildPrintDocument(bodyHtml: string, title: string, options: PrintOptions = DEFAULT_PRINT_OPTIONS): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
${printCss(options)}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/** Turns the editor text into a sanitised HTML body. `sanitise` is injected so this stays testable without a DOM. */
export function renderBody(source: string, kind: SourceKind, sanitise: (html: string) => string): string {
  if (!source.trim()) return '';
  return sanitise(kind === 'markdown' ? markdownToHtml(source) : source);
}

/** A safe file name for the saved HTML (and the suggested name when saving as PDF). */
export function fileNameFor(title: string): string {
  const base = title.replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  return base || 'document';
}
