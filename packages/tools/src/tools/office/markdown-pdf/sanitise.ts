import DOMPurify from 'dompurify';

type Purifier = ReturnType<typeof DOMPurify>;

const REMOTE = /^\s*(https?:)?\/\//i;

/**
 * Builds a sanitiser for print documents. Scripts, event handlers and external stylesheets are removed.
 * Images that point at another origin are replaced by a visible note: the app never makes a request to
 * another origin, so they could not load anyway, and a silent broken image would be misleading.
 */
export function createSanitiser(win: Window & typeof globalThis): (html: string) => string {
  const purify: Purifier = DOMPurify(win);
  purify.addHook('afterSanitizeAttributes', (node) => {
    if (node.nodeName !== 'IMG') return;
    const src = node.getAttribute('src') ?? '';
    if (REMOTE.test(src)) {
      const note = node.ownerDocument.createElement('span');
      note.className = 'blocked-image';
      note.textContent = `[image not loaded: ${node.getAttribute('alt') || src.slice(0, 80)}]`;
      node.replaceWith(note);
    }
  });
  return (html) =>
    purify.sanitize(html, {
      FORCE_BODY: true,
      ADD_TAGS: ['style'],
      FORBID_TAGS: ['link', 'meta', 'base', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'script'],
      FORBID_ATTR: ['srcset'],
    });
}
