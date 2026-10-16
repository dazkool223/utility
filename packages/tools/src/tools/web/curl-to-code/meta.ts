import { defineTool } from '@/core/types';

export default defineTool({
  id: 'curl-to-code',
  path: 'web/curl-to-code',
  name: 'cURL to Code',
  description: 'Turn a curl command into JavaScript fetch, Python requests or a clean shell command',
  category: 'web',
  priority: 'P2',
  aliases: ['curl to fetch', 'curl to python', 'curl converter', 'curl to javascript', 'curl to requests', 'devtools copy as curl'],
  related: ['url-parse', 'url-encode', 'user-agent-parse', 'json-format'],
  inputKind: 'text',
  accepts: ['curl'],
  example: { input: `curl -X POST https://api.example.com/items -H 'Content-Type: application/json' -d '{"name":"widget"}'`, expect: 'await fetch("https://api.example.com/items"' },
  restrictions: [{ message: 'Files referenced with @file in -d or -F cannot be read in the browser, so those commands are rejected. Paste the file contents into the command instead.' }],
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'curl-to-code:javascript', label: 'Web: curl to JavaScript fetch', run: (s: string) => m.curlToCode(s, 'javascript') },
      { id: 'curl-to-code:python', label: 'Web: curl to Python requests', run: (s: string) => m.curlToCode(s, 'python') },
      { id: 'curl-to-code:shell', label: 'Web: curl, normalised shell', run: (s: string) => m.curlToCode(s, 'shell') },
    ]),
});
