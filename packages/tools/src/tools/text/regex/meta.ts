import { defineTool } from '@/core/types';

export default defineTool({
  id: 'regex-tester',
  path: 'text/regex',
  name: 'Regex Tester',
  description: 'Test JavaScript regular expressions: see matches, capture groups and the result of a replacement',
  category: 'text',
  priority: 'P0',
  aliases: ['regular expression', 'regexp', 'regex', 'pattern match', 'regex replace', 'test regex'],
  related: ['regex-cheatsheet', 'text-diff'],
  inputKind: 'text',
  restrictions: [{ message: 'This uses the JavaScript regular expression engine. Features from other flavours (PCRE, Python, .NET), such as possessive quantifiers, atomic groups or inline modifiers, may not work or may behave differently.' }],
  example: { input: 'Invoices 2024 and 1999 were paid', expect: '1999' },
  load: () => import('./Tool'),
});
