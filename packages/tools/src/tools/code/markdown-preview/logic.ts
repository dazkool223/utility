import { DEFAULT_MARKDOWN, markdownToHtml, sanitizeHtml, type MarkdownOptions } from '../_lib/markdown';

/** Sanitised HTML for showing on the page. Remote images and other network resources are not loaded. */
export function renderPreview(input: string, o: MarkdownOptions = DEFAULT_MARKDOWN): string {
  if (!input.trim()) return '';
  return sanitizeHtml(markdownToHtml(input, o), { blockRemoteResources: true });
}

/** Plain text of the rendered document, for the Pipeline. */
export function renderedText(input: string, o: MarkdownOptions = DEFAULT_MARKDOWN): string {
  if (!input.trim()) return '';
  const box = document.createElement('div');
  box.innerHTML = renderPreview(input, o);
  return (box.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}

/** Document statistics shown under the preview. */
export function markdownStats(input: string): { words: number; characters: number; headings: number; links: number } {
  const text = input.trim();
  return {
    words: text ? text.split(/\s+/).length : 0,
    characters: input.length,
    headings: (input.match(/^#{1,6}\s/gm) ?? []).length,
    links: (input.match(/\[[^\]]*\]\([^)]+\)/g) ?? []).length,
  };
}
