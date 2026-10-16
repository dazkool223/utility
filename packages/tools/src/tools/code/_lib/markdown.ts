import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import { ToolError } from '@/core/types';

export interface MarkdownOptions {
  /** GitHub-flavoured Markdown: tables, task lists, strikethrough, autolinks. */
  gfm: boolean;
  /** Turn single line breaks into <br>. */
  breaks: boolean;
}

export const DEFAULT_MARKDOWN: MarkdownOptions = { gfm: true, breaks: false };

/** Raw HTML exactly as the Markdown parser produces it. */
export function markdownToHtml(src: string, o: MarkdownOptions = DEFAULT_MARKDOWN): string {
  const marked = new Marked({ gfm: o.gfm, breaks: o.breaks });
  const out = marked.parse(src, { async: false });
  if (typeof out !== 'string') throw new ToolError('The Markdown parser returned an unexpected result.');
  return out;
}

const REMOTE_ATTRS = ['src', 'srcset', 'poster', 'data'] as const;
const isLocal = (v: string) => /^\s*(data|blob):/i.test(v);

/**
 * Make HTML safe to show on this page: no scripts, event handlers, forms or styles, and no resource that would
 * trigger a network request (images from other sites are replaced by their alt text). Needs a DOM.
 */
export function sanitizeHtml(html: string, opts: { blockRemoteResources?: boolean } = {}): string {
  if (typeof document === 'undefined') throw new ToolError('Sanitising HTML needs a browser DOM, which is not available here.');
  const frag = DOMPurify.sanitize(html, {
    RETURN_DOM_FRAGMENT: true,
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'option', 'link', 'meta', 'iframe', 'frame', 'object', 'embed', 'base', 'svg', 'math'],
    FORBID_ATTR: ['style'],
  });
  if (opts.blockRemoteResources ?? true) {
    for (const el of Array.from(frag.querySelectorAll('img,video,audio,source,track,picture'))) {
      const remote = REMOTE_ATTRS.some((a) => {
        const v = el.getAttribute(a);
        return v !== null && !isLocal(v);
      });
      if (!remote) continue;
      if (el.tagName === 'IMG') {
        const alt = el.getAttribute('alt');
        const span = document.createElement('span');
        span.className = 'blocked-image';
        span.textContent = `[image${alt ? ': ' + alt : ''} (remote images are not loaded)]`;
        el.replaceWith(span);
      } else {
        el.remove();
      }
    }
  }
  for (const a of Array.from(frag.querySelectorAll('a'))) {
    a.setAttribute('rel', 'noopener noreferrer');
    a.setAttribute('target', '_blank');
  }
  const box = document.createElement('div');
  box.appendChild(frag);
  return box.innerHTML;
}
