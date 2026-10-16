import { DEFAULT_MARKDOWN, markdownToHtml, sanitizeHtml, type MarkdownOptions } from '../_lib/markdown';

export interface MdHtmlOptions extends MarkdownOptions {
  /** Remove scripts, event handlers and other active content from the HTML. Needs a browser. */
  sanitize: boolean;
}

export const DEFAULT_MD_HTML: MdHtmlOptions = { ...DEFAULT_MARKDOWN, sanitize: false };

export function mdToHtml(input: string, o: MdHtmlOptions = DEFAULT_MD_HTML): string {
  if (!input.trim()) return '';
  const html = markdownToHtml(input, o);
  return (o.sanitize ? sanitizeHtml(html, { blockRemoteResources: false }) : html).trimEnd();
}
