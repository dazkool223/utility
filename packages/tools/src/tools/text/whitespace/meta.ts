import { defineTool } from '@/core/types';

export default defineTool({
  id: 'whitespace-cleanup',
  path: 'text/whitespace',
  name: 'Whitespace & Line-Break Cleanup',
  description: 'Trim lines, collapse extra spaces and blank lines, join lines and normalise line endings',
  category: 'text',
  audience: 'general',
  priority: 'P1',
  aliases: ['remove extra spaces', 'remove blank lines', 'remove line breaks', 'trim whitespace', 'collapse spaces', 'strip whitespace', 'crlf to lf', 'zero width'],
  related: ['line-tools', 'line-numbers'],
  inputKind: 'text',
  example: { input: '  hello    world  \n\n\n\n  second   line  ', expect: 'hello world' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'whitespace:tidy', label: 'Whitespace: tidy (trim, collapse spaces and blank lines)', run: (s: string) => m.cleanWhitespace(s, m.DEFAULT_WHITESPACE) },
      { id: 'whitespace:join', label: 'Whitespace: join lines into one', run: (s: string) => m.cleanWhitespace(s, { ...m.DEFAULT_WHITESPACE, joinLines: true }) },
    ]),
});
