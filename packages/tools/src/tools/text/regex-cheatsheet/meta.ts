import { defineTool } from '@/core/types';

export default defineTool({
  id: 'regex-cheatsheet',
  path: 'text/regex-cheatsheet',
  name: 'Regex Cheatsheet',
  description: 'A searchable quick reference for JavaScript regular expression syntax, flags and common patterns',
  category: 'text',
  priority: 'P2',
  aliases: ['regex reference', 'regular expression syntax', 'regex help', 'regex cheat sheet', 'regexp syntax'],
  related: ['regex-tester'],
  inputKind: 'none',
  restrictions: [{ message: 'This reference covers JavaScript regular expressions. Other flavours (PCRE, Python, .NET) differ in places.' }],
  load: () => import('./Tool'),
});
