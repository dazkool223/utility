import { defineTool } from '@/core/types';

export default defineTool({
  id: 'url-encode',
  path: 'encoders/url',
  name: 'URL Encode / Decode',
  description: 'Percent-encode or decode text, as a URL component, a full URI or form data',
  category: 'encoders',
  priority: 'P0',
  aliases: ['percent encoding', 'urlencode', 'urldecode', 'encodeURIComponent', 'uri encode', 'query string encode'],
  related: ['base64-text', 'html-entities', 'string-escape'],
  inputKind: 'text',
  accepts: ['url-encoded'],
  quickLauncher: true,
  contextMenu: 'URL-decode',
  example: { input: 'a b&c=d/é', expect: 'a%20b%26c%3Dd%2F%C3%A9' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'url-encode:encode', label: 'URL: encode component', run: (s: string) => m.encodeUrl(s, 'component') },
      { id: 'url-encode:decode', label: 'URL: decode', run: (s: string) => m.decodeUrl(s, 'component') },
    ]),
});
