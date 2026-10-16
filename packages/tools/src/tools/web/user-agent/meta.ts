import { defineTool } from '@/core/types';

export default defineTool({
  id: 'user-agent-parse',
  path: 'web/user-agent',
  name: 'User-Agent Parser',
  description: 'Identify the browser, engine, operating system and device behind a User-Agent string',
  category: 'web',
  priority: 'P1',
  aliases: ['ua parser', 'user agent', 'browser detector', 'useragent', 'whatismybrowser', 'parse ua'],
  related: ['url-parse', 'curl-to-code'],
  inputKind: 'text',
  example: {
    input: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    expect: 'Chrome 120.0.0.0',
  },
  restrictions: [{ message: 'Detection is based on known User-Agent patterns, so new or heavily customised browsers may show as Unknown. Browsers that reduce their User-Agent hide the exact OS version.' }],
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'user-agent-parse:summary', label: 'Web: parse User-Agent', run: (s: string) => m.describeUserAgent(s) },
      { id: 'user-agent-parse:json', label: 'Web: parse User-Agent to JSON', run: (s: string) => m.userAgentJson(s) },
    ]),
});
