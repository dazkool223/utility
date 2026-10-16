import { defineTool } from '@/core/types';

export default defineTool({
  id: 'url-parse',
  path: 'web/url-parser',
  name: 'URL Parser',
  description: 'Split a URL into protocol, host, port, path, query parameters and fragment',
  category: 'web',
  audience: 'developer',
  priority: 'P1',
  aliases: ['parse url', 'url parts', 'query string', 'query params', 'url breakdown', 'uri parser'],
  related: ['url-encode', 'curl-to-code', 'user-agent-parse', 'json-format'],
  inputKind: 'text',
  accepts: ['url'],
  example: { input: 'https://user:pw@example.com:8080/docs/intro?lang=en&v=2#top', expect: 'Hostname' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'url-parse:report', label: 'Web: parse URL into parts', run: (s: string) => m.describeUrl(s) },
      { id: 'url-parse:json', label: 'Web: parse URL to JSON', run: (s: string) => m.urlToJson(s) },
      { id: 'url-parse:query', label: 'Web: URL query parameters (key=value lines)', run: (s: string) => m.urlQueryLines(s) },
    ]),
});
